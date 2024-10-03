import { it } from "../../../../helpers";
import { Auth, ContactChannels, backendContext, niceBackendFetch } from "../../../backend-helpers";

it("signs in with OTP, disable used for auth, then should not be able to sign in again", async ({ expect }) => {
  await Auth.Otp.signIn();
  const cc = await ContactChannels.getTheOnlyContactChannel();
  // disable used for auth on the contact channel
  const response1 = await niceBackendFetch(`/api/v1/contact-channels/me/${cc.id}`, {
    method: "PATCH",
    accessType: "server",
    body: {
      is_verified: false,
    },
  });
  expect(response1.status).toBe(200);

  // should not be able to sign in again
  const response2 = await niceBackendFetch("/api/v1/auth/otp/send-sign-in-code", {
    method: "POST",
    accessType: "client",
    body: {
      email: backendContext.value.mailbox.emailAddress,
      callback_url: "http://localhost:12345/some-callback-url",
    },
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": {
        "code": "USER_EMAIL_ALREADY_EXISTS",
        "error": "User already exists.",
      },
      "headers": Headers {
        "x-stack-known-error": "USER_EMAIL_ALREADY_EXISTS",
        <some fields may have been hidden>,
      },
    }
  `);
});
