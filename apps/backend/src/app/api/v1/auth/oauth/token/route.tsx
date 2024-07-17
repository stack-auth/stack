import { oauthServer } from "@/oauth";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { InvalidClientError, InvalidGrantError, Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";
import { KnownErrors } from "@stackframe/stack-shared/dist/known-errors";
import { yupMixed, yupNumber, yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";

export const POST = createSmartRouteHandler({
  metadata: {
    summary: "OAuth token endpoints",
    description: "This endpoint is used to exchange an authorization code or refresh token for an access token.",
    tags: ["Oauth"]
  },
  request: yupObject({
    body: yupObject({
      grant_type: yupString().oneOf(["refresh_token", "authorization_code"]).required(),
      code: yupString(),
      code_verifier: yupString(),
      redirect_uri: yupString(),
      refresh_token: yupString(),
      client_id: yupString().required(),
    }).required(),
  }),
  response: yupObject({
    statusCode: yupNumber().required(),
    bodyType: yupString().oneOf(["json"]).required(),
    body: yupMixed().required(),
    headers: yupMixed().required(),
  }),
  async handler({ body }, fullReq) {
    if (body.redirect_uri) {
      body.redirect_uri = body.redirect_uri.split('#')[0]; // remove hash
    }
    const oauthRequest = new OAuthRequest({
      headers: {
        'content-type': fullReq.headers['content-type']?.map(v => v.split(';')[0]).join(';'), // the OAuth server library doesn't like the charset in the content-type header
      },
      method: "POST",
      body: body,
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
        throw new KnownErrors.RefreshTokenExpired();
      }
      if (e instanceof InvalidClientError) {
        throw new KnownErrors.InvalidOAuthClientId(body.client_id);
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
