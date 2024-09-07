import { it } from "../../../../../../../helpers";
import { Auth, backendContext, niceBackendFetch } from "../../../../../../backend-helpers";

it("should refresh sessions", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  backendContext.set({ userAuth: { ...backendContext.value.userAuth, accessToken: undefined } });
  await Auth.expectSessionToBeValid();
  const refreshSessionResponse = await niceBackendFetch("/api/v1/auth/sessions/current/refresh", {
    method: "POST",
    accessType: "client",
  });
  expect(refreshSessionResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "access_token": <stripped field 'access_token'> },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
  backendContext.set({ userAuth: { ...backendContext.value.userAuth, accessToken: refreshSessionResponse.body.access_token } });
  await Auth.expectSessionToBeValid();
  await Auth.expectToBeSignedIn();
});

it("should not refresh sessions given invalid refresh tokens", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  const refreshSessionResponse = await niceBackendFetch("/api/v1/auth/sessions/current/refresh", {
    method: "POST",
    accessType: "client",
    headers: {
      "x-stack-refresh-token": "something-invalid"
    },
  });
  expect(refreshSessionResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 401,
      "body": {
        "code": "REFRESH_TOKEN_NOT_FOUND_OR_EXPIRED",
        "error": "Refresh token not found for this project, or the session has expired/been revoked.",
      },
      "headers": Headers {
        "x-stack-known-error": "REFRESH_TOKEN_NOT_FOUND_OR_EXPIRED",
        <some fields may have been hidden>,
      },
    }
  `);
});

it.todo("should not refresh sessions of other projects");
