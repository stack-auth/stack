import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { adaptSchema, yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

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
    const projectId = req.auth.project.id;
    // const users = await prismaClient.projectUser.findMany();

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        totalUsers: PLACEHOLDER_DATA,
        dailyActiveUsers: PLACEHOLDER_DATA,
      }
    };
  },
});

