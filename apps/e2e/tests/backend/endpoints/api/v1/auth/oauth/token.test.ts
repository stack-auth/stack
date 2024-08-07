
import { describe } from "vitest";
import { it } from "../../../../../../helpers";
import { Auth, niceBackendFetch } from "../../../../../backend-helpers";

describe("with grant_type === 'authorization_code'", async () => {
  it("should sign in a user when called as part of the OAuth flow", async ({ expect }) => {
    const response = await Auth.OAuth.signIn();
    expect(response.tokenResponse).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "access_token": <stripped field 'access_token'>,
          "afterCallbackRedirectUrl": null,
          "after_callback_redirect_url": null,
          "expires_in": 3599,
          "is_new_user": true,
          "newUser": true,
          "refresh_token": <stripped field 'refresh_token'>,
          "scope": "legacy",
          "token_type": "Bearer",
        },
        "headers": Headers {
          "pragma": "no-cache",
          <some fields may have been hidden>,
        },
      }
    `);
    await Auth.expectToBeSignedIn();
    const meResponse = await niceBackendFetch("/api/v1/users/me", { accessType: "client" });
    expect(meResponse).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "auth_methods": [
            {
              "provider": {
                "provider_user_id": "<stripped UUID>@stack-generated.example.com",
                "type": "facebook",
              },
              "type": "oauth",
            },
          ],
          "auth_with_email": false,
          "client_metadata": null,
          "connected_accounts": [
            {
              "provider": {
                "provider_user_id": "<stripped UUID>@stack-generated.example.com",
                "type": "facebook",
              },
              "type": "oauth",
            },
          ],
          "display_name": null,
          "has_password": false,
          "id": "<stripped UUID>",
          "oauth_providers": [
            {
              "account_id": "<stripped UUID>@stack-generated.example.com",
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "facebook",
            },
          ],
          "primary_email": "<stripped UUID>@stack-generated.example.com",
          "primary_email_verified": false,
          "profile_image_url": null,
          "selected_team": null,
          "selected_team_id": null,
          "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });
});
