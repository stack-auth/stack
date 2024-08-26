import { oauthServer } from "@/oauth";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { InvalidClientError, InvalidGrantError, InvalidRequestError, Request as OAuthRequest, Response as OAuthResponse, ServerError } from "@node-oauth/oauth2-server";
import { KnownErrors } from "@stackframe/stack-shared/dist/known-errors";
import { yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { oauthResponseToSmartResponse } from "../oauth-helpers";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "OAuth token endpoints",
    description: "This endpoint is used to exchange an authorization code or refresh token for an access token.",
    tags: ["Oauth"]
  },
  request: yupObject({
    body: yupObject({
      grant_type: yupString().oneOf(["authorization_code", "refresh_token"]).required(),
    }).unknown().required(),
  }).required(),
  response: yupObject({
    statusCode: yupNumber().oneOf([200]).required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupMixed().required(),
    headers: yupMixed().required(),
  }),
  async handler(req, fullReq) {
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
        switch (req.body.grant_type) {
          case "authorization_code": {
            throw new KnownErrors.InvalidAuthorizationCode();
          }
          case "refresh_token": {
            throw new KnownErrors.RefreshTokenNotFoundOrExpired();
          }
        }
      }
      if (e instanceof InvalidClientError) {
        throw new KnownErrors.InvalidOAuthClientIdOrSecret();
      }
      if (e instanceof InvalidRequestError) {
        if (e.message.includes("`redirect_uri` is invalid")) {
          throw new KnownErrors.RedirectUrlNotWhitelisted();
        }
      }
      if (e instanceof ServerError) {
        throw (e as any).inner ?? e;
      }
      throw e;
    }

    return oauthResponseToSmartResponse(oauthResponse);
  },
});
