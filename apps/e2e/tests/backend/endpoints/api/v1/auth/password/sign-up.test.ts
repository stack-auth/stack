import { it } from "../../../../../../helpers";
import { Auth, backendContext } from "../../../../../backend-helpers";

it.todo("should sign up new users", async ({ expect }) => {
  const res = await Auth.Password.signUpWithEmail();
  expect(res.signUpResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "access_token": <stripped field 'access_token'>,
        "is_new_user": true,
        "refresh_token": <stripped field 'refresh_token'>,
        "user_id": <stripped field 'user_id'>,
      },
      "headers": Headers {
        "x-stack-request-id": <stripped header 'x-stack-request-id'>,
        <some fields may have been hidden>,
      },
    }
  `);
  const messages = await backendContext.value.mailbox.fetchMessages({ subjectOnly: true });
  expect(messages).toMatchInlineSnapshot(`abc`);
});

it.todo("should not allow signing up with an e-mail that already exists");

it.todo("cannot use empty password to sign up");

it.todo("cannot use a password that is too short to sign up");
