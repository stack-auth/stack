import { createMailbox, it } from "../../../../helpers";
import { Auth, Team, backendContext } from "../../../backend-helpers";

it("should verify user's email", async ({ expect }) => {
  const { userId: userId1 } = await Auth.Otp.signIn();
  const { teamId } = await Team.create();

  const receiveMailbox = createMailbox();
  await Team.sendInvitation(receiveMailbox);

  backendContext.set({ mailbox: receiveMailbox });
  const { userId: userId2 } = await Auth.Otp.signIn();

  await Team.acceptInvitation();
});