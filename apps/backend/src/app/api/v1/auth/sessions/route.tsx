import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { yupObject, adaptSchema, yupString, yupNumber, serverOrHigherAuthTypeSchema, userIdOrMeSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { usersCrudHandlers } from "../../users/crud";
import { CrudHandlerInvocationError } from "@/route-handlers/crud-handler";
import { createAuthTokens } from "@/lib/tokens";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "Create session",
    description: "Create a new session for a given user. This will return a refresh token that can be used to impersonate the user.",
    tags: ["Sessions"],
  },
  request: yupObject({
    auth: yupObject({
      type: serverOrHigherAuthTypeSchema,
      project: adaptSchema.defined(),
    }).defined(),
    body: yupObject({
      user_id: userIdOrMeSchema.defined(),
      expires_in_millis: yupNumber().max(1000 * 60 * 60 * 24 * 367).default(1000 * 60 * 60 * 24 * 365),
    }).defined(),
  }),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).defined(),
    bodyType: yupString().oneOf(["json"]).defined(),
    body: yupObject({
      refresh_token: yupString().defined(),
      access_token: yupString().defined(),
    }).defined(),
  }),
  async handler({ auth: { project }, body: { user_id: userId, expires_in_millis: expiresInMillis } }) {
    let user;
    try {
      user = await usersCrudHandlers.adminRead({
        user_id: userId,
        project: project,
      });
    } catch (e) {
      if (e instanceof CrudHandlerInvocationError && e.cause instanceof KnownErrors.UserNotFound) {
        throw new KnownErrors.UserIdDoesNotExist(userId);
      }
      throw e;
    }

    const { refreshToken, accessToken } = await createAuthTokens({
      projectId: project.id,
      projectUserId: user.id,
      useLegacyGlobalJWT: project.config.legacy_global_jwt_signing,
      expiresAt: new Date(Date.now() + expiresInMillis),
    });

    return {
      statusCode: 200,
      bodyType: "json",
      body: {
        refresh_token: refreshToken,
        access_token: accessToken,
      }
    };
  },
});
