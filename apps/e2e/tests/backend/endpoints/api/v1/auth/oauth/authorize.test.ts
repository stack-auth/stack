import { it, localRedirectUrl } from "../../../../../../helpers";
import { backendContext, niceBackendFetch } from "../../../../../backend-helpers";

function getAuthorizeQuery() {
  const projectKeys = backendContext.value.projectKeys;
  if (projectKeys === "no-project") throw new Error("No project keys found in the backend context");

  return {
    client_id: projectKeys.projectId,
    client_secret: projectKeys.publishableClientKey,
    redirect_uri: localRedirectUrl,
    scope: "legacy",
    response_type: "code",
    state: "this is some state",
    grant_type: "authorization_code",
    code_challenge: "some-code-challenge",
    code_challenge_method: "plain",
  };
}

it("should redirect the user to the OAuth provider with the right arguments", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/github", {
    redirect: "manual",
    query: {
      ...getAuthorizeQuery(),
    },
  });
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?.*$/);
  expect(response.headers.get("set-cookie")).toMatch(/^stack-oauth-inner-state-[^=]+=true; Path=\/; Expires=[^;]+; Max-Age=600; HttpOnly$/);
});

it("should fail if an invalid client_id is provided", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/github", {
    redirect: "manual",
    query: {
      ...getAuthorizeQuery(),
      client_id: "some-invalid-client-id",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 404,
      "body": {
        "code": "PROJECT_NOT_FOUND",
        "error": "Project not found or is not accessible with the current user.",
      },
      "headers": Headers {
        "x-stack-known-error": "PROJECT_NOT_FOUND",
        <some fields may have been hidden>,
      },
    }
  `);
});

it("should fail if an invalid client_secret is provided", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/github", {
    redirect: "manual",
    query: {
      ...getAuthorizeQuery(),
      client_secret: "some-invalid-client-secret",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 404,
      "body": {
        "code": "API_KEY_NOT_FOUND",
        "error": "API key not found.",
      },
      "headers": Headers {
        "x-stack-known-error": "API_KEY_NOT_FOUND",
        <some fields may have been hidden>,
      },
    }
  `);
});
