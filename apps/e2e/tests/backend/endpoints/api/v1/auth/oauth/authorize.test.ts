import { it } from "../../../../../../helpers";
import { Auth, niceBackendFetch } from "../../../../../backend-helpers";

it("should redirect the user to the OAuth provider with the right arguments", async ({ expect }) => {
  const response = await Auth.OAuth.authorize();
  expect(response.authorizeResponse.status).toBe(307);
  expect(response.authorizeResponse.headers.get("location")).toMatch(/^http:\/\/localhost:8114\/auth\?.*$/);
  expect(response.authorizeResponse.headers.get("set-cookie")).toMatch(/^stack-oauth-inner-[^;]+=[^;]+; Path=\/; Expires=[^;]+; Max-Age=\d+;( Secure;)? HttpOnly$/);
});

it("should be able to fetch the inner callback URL by following the OAuth provider redirects", async ({ expect }) => {
  const { innerCallbackUrl } = await Auth.OAuth.getInnerCallbackUrl();
  expect(innerCallbackUrl.origin).toBe("http://localhost:8102");
  expect(innerCallbackUrl.pathname).toBe("/api/v1/auth/oauth/callback/spotify");
});

it("should fail if an invalid client_id is provided", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/spotify", {
    redirect: "manual",
    query: {
      ...await Auth.OAuth.getAuthorizeQuery(),
      client_id: "some-invalid-client-id",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "INVALID_OAUTH_CLIENT_ID_OR_SECRET",
        "details": { "client_id": "some-invalid-client-id" },
        "error": "The OAuth client ID or secret is invalid. The client ID must be equal to the project ID, and the client secret must be a publishable client key.",
      },
      "headers": Headers {
        "x-stack-known-error": "INVALID_OAUTH_CLIENT_ID_OR_SECRET",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should fail if an invalid client_secret is provided", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/spotify", {
    redirect: "manual",
    query: {
      ...await Auth.OAuth.getAuthorizeQuery(),
      client_secret: "some-invalid-client-secret",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "INVALID_PUBLISHABLE_CLIENT_KEY",
        "details": { "project_id": "internal" },
        "error": "The publishable key is not valid for the project \\"internal\\". Does the project and/or the key exist?",
      },
      "headers": Headers {
        "x-stack-known-error": "INVALID_PUBLISHABLE_CLIENT_KEY",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should fail if an invalid redirect URL is provided", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/spotify", {
    redirect: "manual",
    query: {
      ...await Auth.OAuth.getAuthorizeQuery(),
      redirect_uri: "this is an invalid URL string",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "SCHEMA_ERROR",
        "details": { "message": "Request validation failed on GET /api/v1/auth/oauth/authorize/spotify:\\n  - Invalid URL" },
        "error": "Request validation failed on GET /api/v1/auth/oauth/authorize/spotify:\\n  - Invalid URL",
      },
      "headers": Headers {
        "x-stack-known-error": "SCHEMA_ERROR",
        <some fields may have been hidden>,
      },
    }
  `);
});
