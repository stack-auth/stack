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
    state: "this-is-some-state",
    grant_type: "authorization_code",
    code_challenge: "some-code-challenge",
    code_challenge_method: "plain",
  };
}

it.todo("should redirect the user to the OAuth provider with the right arguments", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/github", {
    redirect: "manual",
    query: {
      ...getAuthorizeQuery(),
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 307,
      "body": ArrayBuffer {},
      "headers": Headers {
        "location": "https://github.com/login/oauth/authorize?client_id=a0bdabcbaa2ebee7baf8&scope=user%3Aemail&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8102%2Fapi%2Fv1%2Fauth%2Fcallback%2Fgithub&code_challenge=jrqrYf-FEFGmR2ZOvirNTsPG6rxS6-YqydeeWCLlbPM&code_challenge_method=S256&state=AEuDTUBPNj94myGIQ3lFWawZJf1NmvKYIy1yAAzFHZg&access_type=offline",
        "set-cookie": "stack-oauth-inner-state-AEuDTUBPNj94myGIQ3lFWawZJf1NmvKYIy1yAAzFHZg=true; Path=/; Expires=Thu, 04 Jul 2024 22:11:21 GMT; Max-Age=600; HttpOnly",
        <some fields may have been hidden>,
      },
    }
  `);
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
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
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
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
});

it.todo("should fail if an unknown scope is provided", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/auth/oauth/authorize/github", {
    redirect: "manual",
    query: {
      ...getAuthorizeQuery(),
      scope: "some-unknown-scope",
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 307,
      "body": ArrayBuffer {},
      "headers": Headers {
        "location": "https://github.com/login/oauth/authorize?client_id=a0bdabcbaa2ebee7baf8&scope=user%3Aemail&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A8102%2Fapi%2Fv1%2Fauth%2Fcallback%2Fgithub&code_challenge=QjHKeCuQPOOyozhVTSFE0Ok1vSBHTqmuMM4uT2lQpsI&code_challenge_method=S256&state=qB5xa9u7Ib4QIfRmZJ4zfht19ChBjcEOw9lDrdXN_7o&access_type=offline",
        "set-cookie": "stack-oauth-inner-state-qB5xa9u7Ib4QIfRmZJ4zfht19ChBjcEOw9lDrdXN_7o=true; Path=/; Expires=Thu, 04 Jul 2024 22:11:25 GMT; Max-Age=600; HttpOnly",
        <some fields may have been hidden>,
      },
    }
  `);
});
