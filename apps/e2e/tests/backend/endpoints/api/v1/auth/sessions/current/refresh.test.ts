import { it } from "../../../../../../../helpers";
import { Auth, backendContext, niceBackendFetch } from "../../../../../../backend-helpers";

it("should refresh sessions", async ({ expect }) => {
  await Auth.Password.signUpWithEmail();
  backendContext.value.userAuth!.accessToken = undefined;
  await Auth.expectToBeSignedOut();
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
  backendContext.value.userAuth!.accessToken = refreshSessionResponse.body.access_token;
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
        "code": "REFRESH_TOKEN_NOT_FOUND",
        "error": "Refresh token not found for this project.",
      },
      "headers": Headers {
        "x-stack-known-error": "REFRESH_TOKEN_NOT_FOUND",
        <some fields may have been hidden>,
      },
    }
  `);
});

it.todo("should not refresh sessions of other projects");
