import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { ContactChannel, ProjectUser } from "@prisma/client";
import { adaptSchema, adminAuthTypeSchema, yupArray, yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import yup from 'yup';

type DataPoints = yup.InferType<typeof DataPointsSchema>;

const DataPointsSchema = yupArray(yupObject({
  date: yupString().defined(),
  activity: yupNumber().defined(),
}).defined()).defined();


async function loadUsersByCountry(projectId: string): Promise<Record<string, number>> {
  const a = await prismaClient.$queryRaw<{countryCode: string|null, userCount: bigint}[]>`
    WITH LatestEvent AS (
        SELECT "data"->'userId' AS "userId",
          "countryCode", MAX("eventStartedAt") AS latest_timestamp
        FROM "Event"
        LEFT JOIN "EventIpInfo" eip
          ON "Event"."endUserIpInfoGuessId" = eip.id
        WHERE '$user-activity' = ANY("systemEventTypeIds"::text[])
          AND "data"->>'projectId' = ${projectId}
        GROUP BY "userId", "countryCode"
    )
    SELECT "countryCode", COUNT(DISTINCT "userId") AS "userCount"
    FROM LatestEvent
    GROUP BY "countryCode"
    ORDER BY "userCount" DESC;
  `;

  const rec = Object.fromEntries(
    a.map(({ userCount, countryCode }) => [countryCode, Number(userCount)])
      .filter(([countryCode, userCount]) => countryCode)
  );
  return rec;
}

async function loadTotalUsers(projectId: string, now: Date): Promise<DataPoints> {
  return (await prismaClient.$queryRaw<{date: Date, dailyUsers: bigint, cumUsers: bigint}[]>`
    WITH date_series AS (
        SELECT GENERATE_SERIES(
          ${now}::date - INTERVAL '1 month',
          ${now}::date,
          '1 day'
        )
        AS registration_day
    )
    SELECT 
      ds.registration_day AS "date",
      COALESCE(COUNT(pu."projectUserId"), 0) AS "dailyUsers",
      SUM(COALESCE(COUNT(pu."projectUserId"), 0)) OVER (ORDER BY ds.registration_day) AS "cumUsers"
    FROM date_series ds
    LEFT JOIN "ProjectUser" pu
    ON DATE(pu."createdAt") = ds.registration_day AND pu."projectId" = ${projectId}
    GROUP BY ds.registration_day
    ORDER BY ds.registration_day
  `).map((x) => ({
    date: x.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    activity: Number(x.dailyUsers),
  }));
}

async function loadDailyActiveUsers(projectId: string, now: Date) {
  const res = await prismaClient.$queryRaw<{day: Date, dau: bigint}[]>`
    WITH date_series AS (
      SELECT GENERATE_SERIES(
        ${now}::date - INTERVAL '1 month',
        ${now}::date,
        '1 day'
      )
      AS "day"
    ),
    daily_users AS (
      SELECT
        DATE_TRUNC('day', "eventStartedAt") AS "day",
        COUNT(DISTINCT "data"->'userId') AS "dau"
      FROM "Event"
      WHERE "eventStartedAt" >= ${now} - INTERVAL '1 month'
        AND "eventStartedAt" < ${now}
        AND '$user-activity' = ANY("systemEventTypeIds"::text[])
        AND "data"->>'projectId' = ${projectId}
      GROUP BY DATE_TRUNC('day', "eventStartedAt")
    )
    SELECT ds."day", COALESCE(du.dau, 0) AS dau
    FROM date_series ds
    LEFT JOIN daily_users du 
    ON ds."day" = du."day"
    ORDER BY ds."day"
  `;

  return res.map(x => ({
    date: x.day.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    activity: Number(x.dau),
  }));
}

async function loadLoginMethods(projectId: string): Promise<{method: string, count: number }[]> {
  return await prismaClient.$queryRaw<{ method: string, count: number }[]>`
    WITH tab AS (
      SELECT COALESCE(soapc."type"::text, poapc."type"::text, 'other') AS "method", method.id AS id FROM "AuthMethod" method
      LEFT JOIN "OAuthAuthMethod" oaam ON method.id = oaam."authMethodId"
      LEFT JOIN "OAuthProviderConfig" oapc
        ON oaam."projectConfigId" = oapc."projectConfigId" AND oaam."oauthProviderConfigId" = oapc.id
      LEFT JOIN "StandardOAuthProviderConfig" soapc
        ON oapc."projectConfigId" = soapc."projectConfigId" AND oapc.id = soapc.id
        LEFT JOIN "ProxiedOAuthProviderConfig" poapc
        ON oapc."projectConfigId" = poapc."projectConfigId" AND oapc.id = poapc.id
      WHERE method."projectId" = ${projectId})
    SELECT LOWER("method") AS method, COUNT(id)::int AS "count" FROM tab
    GROUP BY "method"
  `;
}

function simplifyUsers(users: (ProjectUser & { contactChannels: ContactChannel[] })[]): any {
  return users.map((user) => ({
    id: user.projectUserId,
    display_name: user.displayName,
    email: user.contactChannels.find(x => x.isPrimary)?.value ?? '-',
    created_at_millis: user.createdAt.getTime(),
    updated_at_millis: user.updatedAt.getTime(),
  }));
}

async function loadRecentlyActiveUsers(projectId: string):
  Promise<(ProjectUser & { contactChannels: ContactChannel[] })[]> {

  // use the Events table to get the most recent activity
  const events = await prismaClient.event.findMany({
    take: 10,
    where: {
      AND: [
        {
          data: {
            path: ['projectId'],
            equals: projectId,
          }
        },
        {
          systemEventTypeIds: {
            has: '$user-activity',
          }
        }
      ]
    },
    orderBy: [{
      eventStartedAt: 'desc'
    }],
  });
  return await prismaClient.projectUser.findMany({
    take: 10,
    where: { projectId, projectUserId: { in: events.map(x => (x.data as any).userId) } },
    include: { contactChannels: true },
    orderBy: [{
      updatedAt: 'desc'
    }]
  });
}

export const GET = createSmartRouteHandler({
  metadata: {
    hidden: true,
  },
  request: yupObject({
    auth: yupObject({
      type: adminAuthTypeSchema.defined(),
      project: adaptSchema.defined(),
    }),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      total_users: yupNumber().integer().defined(),
      daily_users: DataPointsSchema,
      daily_active_users: DataPointsSchema,
      // TODO: Narrow down the types further
      users_by_country: yupMixed().defined(),
      recently_registered: yupMixed().defined(),
      recently_active: yupMixed().defined(),
      login_methods: yupMixed().defined(),
    }).defined(),
  }),
  handler: async (req) => {
    const now = new Date();

    const [
      totalUsers,
      dailyUsers,
      dailyActiveUsers,
      usersByCountry,
      recentlyRegistered,
      recentlyActive,
      loginMethods
    ] = await Promise.all([
      prismaClient.projectUser.count({
        where: { projectId: req.auth.project.id, },
      }),
      loadTotalUsers(req.auth.project.id, now),
      loadDailyActiveUsers(req.auth.project.id, now),
      loadUsersByCountry(req.auth.project.id),
      prismaClient.projectUser.findMany({
        take: 10,
        where: { projectId: req.auth.project.id, },
        include: { contactChannels: true },
        orderBy: [{
          createdAt: 'desc'
        }]
      }),
      loadRecentlyActiveUsers(req.auth.project.id),
      loadLoginMethods(req.auth.project.id),
    ] as const);

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        total_users: totalUsers,
        daily_users: dailyUsers,
        daily_active_users: dailyActiveUsers,
        users_by_country: usersByCountry,
        recently_registered: simplifyUsers(recentlyRegistered),
        recently_active: simplifyUsers(recentlyActive),
        login_methods: loginMethods,
      }
    };
  },
});

