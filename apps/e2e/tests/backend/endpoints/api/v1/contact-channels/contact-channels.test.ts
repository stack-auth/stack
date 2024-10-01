import { it } from "../../../../../helpers";
import { Auth, Project, niceBackendFetch } from "../../../../backend-helpers";

it("create contact channel on the client", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: true } });
  await Auth.Otp.signIn();
  const response = await niceBackendFetch("/api/v1/contact-channels/me", {
    accessType: "client",
    method: "POST",
    body: {
      value: "test@example.com",
      type: "email",
      used_for_auth: true,
    }
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "id": "<stripped UUID>",
        "is_verified": false,
        "type": "email",
        "used_for_auth": true,
        "value": "test@example.com",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch("/api/v1/users/me", {
    accessType: "client",
  });
  expect(response2.body.contact_channels).toMatchInlineSnapshot(`
    [
      {
        "id": "<stripped UUID>",
        "is_primary": true,
        "is_verified": true,
        "type": "email",
        "used_for_auth": true,
        "value": "<stripped UUID>@stack-generated.example.com",
      },
      {
        "id": "<stripped UUID>",
        "is_primary": false,
        "is_verified": false,
        "type": "email",
        "used_for_auth": true,
        "value": "test@example.com",
      },
    ]
  `);
});
