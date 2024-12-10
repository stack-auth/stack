import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

type DataPoints = { date: string, activity: number }[];

async function loadTotalUsers(projectId: string, now: Date): Promise<DataPoints> {
  return (await prismaClient.$queryRaw<{date: Date, cumUsers: bigint}[]>`
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
    activity: Number(x.cumUsers),
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

const PLACEHOLDER_DATA = [
  { date: "Dec 01", activity: 186, },
  { date: "Dec 02", activity: 205, },
  { date: "Dec 03", activity: 237, },
  { date: "Dec 04", activity: 303, },
  { date: "Dec 05", activity: 309, },
  { date: "Dec 06", activity: 314, },
  { date: "Dec 07", activity: 314, },
  { date: "Dec 08", activity: 314, },
  { date: "Dec 09", activity: 314, },
  { date: "Dec 10", activity: 186, },
  { date: "Dec 11", activity: 186, },
  { date: "Dec 12", activity: 205, },
  { date: "Dec 13", activity: 237, },
  { date: "Dec 14", activity: 303, },
  { date: "Dec 15", activity: 309, },
  { date: "Dec 16", activity: 314, },
  { date: "Dec 17", activity: 314, },
  { date: "Dec 18", activity: 314, },
  { date: "Dec 19", activity: 314, },
  { date: "Dec 20", activity: 186, },
  { date: "Dec 21", activity: 186, },
  { date: "Dec 22", activity: 205, },
  { date: "Dec 23", activity: 237, },
  { date: "Dec 24", activity: 303, },
  { date: "Dec 25", activity: 309, },
  { date: "Dec 26", activity: 314, },
  { date: "Dec 27", activity: 314, },
  { date: "Dec 28", activity: 314, },
  { date: "Dec 29", activity: 314, },
];


export const GET = createSmartRouteHandler({
  metadata: {
    hidden: true,
    summary: "/api/v1/internal/metrics",
    description: "Returns metrics for the metrics page",
    tags: [],
  },
  request: yupObject({
    auth: yupObject({
      type: adaptSchema,
      user: adaptSchema,
      project: adaptSchema,
    }),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupMixed().defined(),
  }),
  handler: async (req) => {
    const now = new Date();

    const [totalUsers, dailyActiveUsers] = await Promise.all([
      loadTotalUsers(req.auth.project.id, now),
      loadDailyActiveUsers(req.auth.project.id, now),
    ] as const);

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        totalUsers,
        dailyActiveUsers,
      }
    };
  },
});

