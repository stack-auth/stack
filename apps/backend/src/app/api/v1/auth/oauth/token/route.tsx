import { oauthServer } from "@/oauth";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { InvalidClientError, InvalidGrantError, Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";
import { KnownErrors } from "@stackframe/stack-shared/dist/known-errors";
import { adaptSchema, yupMixed, yupNumber, yupObject, yupString, yupTuple } from "@stackframe/stack-shared/dist/schema-fields";
import { omit } from "@stackframe/stack-shared/dist/utils/objects";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "OAuth token endpoints",
    description: "This endpoint is used to exchange an authorization code or refresh token for an access token.",
    tags: ["Oauth"]
  },
  request: yupObject({}),
  response: yupObject({
    statusCode: yupNumber().required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupMixed().required(),
    headers: yupMixed().required(),
  }),
  async handler({}, fullReq) {
    const oauthRequest = new OAuthRequest({
      headers: {
        ...fullReq.headers,
        "content-type": "application/x-www-form-urlencoded",
      },
      method: fullReq.method,
      body: fullReq.body,
      query: fullReq.query,
    });


    const oauthResponse = new OAuthResponse();
    try {
      await oauthServer.token(
        oauthRequest,
        oauthResponse,
        {
          // note the `accessTokenLifetime` won't have any effect here because we set it in the `generateAccessToken` function
          refreshTokenLifetime: 60 * 60 * 24 * 365, // 1 year
          alwaysIssueNewRefreshToken: false, // add token rotation later
        }
      );
    } catch (e) {
      if (e instanceof InvalidGrantError) {
        throw new KnownErrors.RefreshTokenNotFoundOrExpired();
      }
      if (e instanceof InvalidClientError) {
        throw new KnownErrors.InvalidOAuthClientIdOrSecret();
      }
      throw e;
    }

    return {
      statusCode: oauthResponse.status || 200,
      bodyType: "json",
      body: oauthResponse.body,
      headers: Object.fromEntries(Object.entries(oauthResponse.headers || {}).map(([k, v]) => ([k, [v]]))),
    };
  },
});
