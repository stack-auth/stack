import { it } from "../../../../../../helpers";
import { backendContext, sendSignInCode } from "../../../../../backend-helpers";

it("should send a sign-in code per e-mail", async ({ expect }) => {
  await sendSignInCode();
  expect(await backendContext.value.mailbox.fetchMessages({ subjectOnly: true })).toMatchInlineSnapshot(`
    [
      MailboxMessage {
        "subject": "Sign in to Stack Dashboard",
        <some fields may have been hidden>,
      },
    ]
  `);
});
