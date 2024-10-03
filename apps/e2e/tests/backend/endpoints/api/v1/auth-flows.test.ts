import { it } from "../../../../helpers";
import { Auth, ContactChannels, niceBackendFetch } from "../../../backend-helpers";

it("signs in with OTP, disable used for auth, then should not be able to sign in again", async ({ expect }) => {
  await Auth.Otp.signIn();
  const cc = await ContactChannels.getTheOnlyContactChannel();
  // disable used for auth on the contact channel
  await niceBackendFetch(`/api/v1/contact-channels/me/${cc.id}`, {
    method: "PATCH",
    body: {
      is_used_for_auth: false,
    },
  });


});
