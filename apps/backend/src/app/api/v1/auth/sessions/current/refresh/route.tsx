import { generateAccessToken } from "@/lib/tokens";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { adaptSchema, clientOrHigherAuthTypeSchema, yupNumber, yupObject, yupString, yupTuple } from "@stackframe/stack-shared/dist/schema-fields";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Refresh access token",
    description: "Get a new access token using a refresh token",
    tags: ["Sessions"],
  },
  request: yupObject({
    auth: yupObject({
      type: clientOrHigherAuthTypeSchema,
      project: adaptSchema,
    }).defined(),
    headers: yupObject({
      "x-stack-refresh-token": yupTuple([yupString().defined()]).defined(),
    }),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      access_token: yupString().defined(),
    }).defined(),
  }),
  async handler({ auth: { project }, headers: { "x-stack-refresh-token": refreshTokenHeaders } }, fullReq) {
    const refreshToken = refreshTokenHeaders[0];

    const sessionObj = await prismaClient.projectUserRefreshToken.findUnique({
      where: {
        projectId_refreshToken: {
          projectId: project.id,
          refreshToken,
        },
      },
    });

    if (!sessionObj || (sessionObj.expiresAt && sessionObj.expiresAt < new Date())) {
      throw new KnownErrors.RefreshTokenNotFoundOrExpired();
    }

    const accessToken = await generateAccessToken({
      projectId: sessionObj.projectId,
      userId: sessionObj.projectUserId,
      useLegacyGlobalJWT: project.config.legacy_global_jwt_signing,
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        access_token: accessToken,
      },
    };
  },
});
