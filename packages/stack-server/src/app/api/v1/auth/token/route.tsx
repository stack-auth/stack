import * as yup from "yup";
import { InvalidGrantError, Request as OAuthRequest, Response as OAuthResponse, InvalidClientError } from "@node-oauth/oauth2-server";
import { NextRequest } from "next/server";
import { oauthServer } from "@/oauth";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { KnownErrors } from "@stackframe/stack-shared";

// make this specific to each grant type later
const postSchema = yup.object({
  body: yup.object({
    grant_type: yup.string().oneOf(["refresh_token", "authorization_code"]).required(),
    code: yup.string(),
    code_verifier: yup.string(),
    redirect_uri: yup.string(),
    refresh_token: yup.string(),
  })
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const { body } = await deprecatedParseRequest(req, postSchema);
  if (body.redirect_uri) {
    body.redirect_uri = body.redirect_uri.split('#')[0]; // remove hash
  }
  const oauthRequest = new OAuthRequest({
    headers: Object.fromEntries(req.headers.entries()),
    query: Object.fromEntries(new URL(req.url).searchParams.entries()),
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
      throw new KnownErrors.InvalidRefreshToken();
    }
    if (e instanceof InvalidClientError) {
      throw new KnownErrors.ProjectNotFound();
    }
    throw e;
  }

  return new Response(JSON.stringify(oauthResponse.body), {
    status: oauthResponse.status,
    headers: oauthResponse.headers
  });
});
