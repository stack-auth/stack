import * as yup from "yup";
import { prismaClient } from "@/prisma-client";
import { createSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { sendEmailFromTemplate } from "@/lib/emails";
import { StackAssertionError, StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { KnownErrors } from "@stackframe/stack-shared/dist/known-errors";
import { InvalidGrantError, Request as OAuthRequest, Response as OAuthResponse, InvalidClientError } from "@node-oauth/oauth2-server";
import { adaptSchema, clientOrHigherAuthTypeSchema, signInEmailSchema, emailOtpSignInCallbackUrlSchema } from "@stackframe/stack-shared/dist/schema-fields";
import { sharedProviders } from "@stackframe/stack-shared/dist/interface/clientInterface";
import { generators } from "openid-client";
import { getProvider } from "@/oauth";
import { decodeAccessToken, oauthCookieSchema } from "@/lib/tokens";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getNodeEnvironment } from "@stackframe/stack-shared/dist/utils/env";
import { getProject } from "@/lib/projects";
import { checkApiKeySet } from "@/lib/api-keys";
import { oauthServer } from "@/oauth";

export const POST = createSmartRouteHandler({
  request: yup.object({
    body: yup.object({
      grant_type: yup.string().oneOf(["refresh_token", "authorization_code"]).required(),
      code: yup.string(),
      code_verifier: yup.string(),
      redirect_uri: yup.string(),
      refresh_token: yup.string(),
    }).required(),
  }),
  response: yup.object({
    statusCode: yup.number().required(),
    bodyType: yup.string().oneOf(["json"]).required(),
    body: yup.mixed().required(),
    headers: yup.mixed().required(),
  }),
  async handler({ body }, fullReq) {
    if (body.redirect_uri) {
      body.redirect_uri = body.redirect_uri.split('#')[0]; // remove hash
    }

    const oauthRequest = new OAuthRequest({
      headers: fullReq.headers,
      query: Object.fromEntries(new URL(fullReq.url).searchParams.entries()),
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

    return {
      statusCode: oauthResponse.status || 200,
      bodyType: "json",
      body: oauthResponse.body,
      headers: Object.fromEntries(Object.entries(oauthResponse.headers || {}).map(([k, v]) => ([k, [v]]))),
    };
  },
});
