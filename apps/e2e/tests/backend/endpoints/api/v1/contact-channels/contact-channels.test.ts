import { it } from "../../../../../helpers";
import { Auth, Project, niceBackendFetch } from "../../../../backend-helpers";

it("create contact channel on the client", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: true } });
  await Auth.Otp.signIn();
  const response = await niceBackendFetch("/api/v1/contact-channels", {
    accessType: "client",
    method: "POST",
    body: {
      value: "test@example.com",
      type: "email",
      used_for_auth: true,
      user_id: "me",
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
        "user_id": "<stripped UUID>",
        "value": "test@example.com",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const response2 = await niceBackendFetch("/api/v1/contact-channels?user_id=me", {
    accessType: "client",
    method: "GET",
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "id": "<stripped UUID>",
            "is_verified": true,
            "type": "email",
            "used_for_auth": true,
            "user_id": "<stripped UUID>",
            "value": "<stripped UUID>@stack-generated.example.com",
          },
          {
            "id": "<stripped UUID>",
            "is_verified": false,
            "type": "email",
            "used_for_auth": true,
            "user_id": "<stripped UUID>",
            "value": "test@example.com",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("cannot create duplicate contact channels", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: true } });
  await Auth.Otp.signIn();

  await niceBackendFetch("/api/v1/contact-channels", {
    accessType: "client",
    method: "POST",
    body: {
      value: "test@example.com",
      type: "email",
      used_for_auth: true,
      user_id: "me",
    }
  });

  const response2 = await niceBackendFetch("/api/v1/contact-channels", {
    accessType: "client",
    method: "POST",
    body: {
      value: "test@example.com",
      type: "email",
      used_for_auth: true,
      user_id: "me",
    }
  });
  expect(response2).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": "Contact channel already exists",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("create contact channel on the server", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: true } });
  const { userId } = await Auth.Otp.signIn();

  const response = await niceBackendFetch(`/api/v1/contact-channels`, {
    accessType: "server",
    method: "POST",
    body: {
      value: "test@example.com",
      type: "email",
      used_for_auth: false,
      is_verified: true,
      user_id: userId,
    }
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 201,
      "body": {
        "id": "<stripped UUID>",
        "is_verified": true,
        "type": "email",
        "used_for_auth": false,
        "user_id": "<stripped UUID>",
        "value": "test@example.com",
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const userResponse = await niceBackendFetch(`/api/v1/contact-channels?user_id=${userId}`, {
    accessType: "server",
  });
  expect(userResponse.body).toMatchInlineSnapshot(`
    {
      "is_paginated": false,
      "items": [
        {
          "id": "<stripped UUID>",
          "is_verified": true,
          "type": "email",
          "used_for_auth": true,
          "user_id": "<stripped UUID>",
          "value": "<stripped UUID>@stack-generated.example.com",
        },
        {
          "id": "<stripped UUID>",
          "is_verified": true,
          "type": "email",
          "used_for_auth": false,
          "user_id": "<stripped UUID>",
          "value": "test@example.com",
        },
      ],
    }
  `);
});


it("delete contact channel on the client", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: true } });
  await Auth.Otp.signIn();

  const meResponse = await niceBackendFetch("/api/v1/contact-channels?user_id=me", {
    accessType: "client",
  });
  expect(meResponse.body.contact_channels).toMatchInlineSnapshot(`undefined`);

  const contactChannelId = meResponse.body.items[0].id;

  const deleteResponse = await niceBackendFetch(`/api/v1/contact-channels/me/${contactChannelId}`, {
    accessType: "client",
    method: "DELETE",
  });
  expect(deleteResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "success": true },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);

  const meResponse2 = await niceBackendFetch("/api/v1/users/me", {
    accessType: "client",
  });
  expect(meResponse2.body).toMatchInlineSnapshot(`
    {
      "auth_with_email": true,
      "client_metadata": null,
      "client_read_only_metadata": null,
      "display_name": null,
      "has_password": false,
      "id": "<stripped UUID>",
      "oauth_providers": [],
      "primary_email": null,
      "primary_email_verified": false,
      "profile_image_url": null,
      "requires_totp_mfa": false,
      "selected_team": null,
      "selected_team_id": null,
      "signed_up_at_millis": <stripped field 'signed_up_at_millis'>,
    }
  `);
});

it("cannot delete a contact channel that doesn't exist", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: true } });
  await Auth.Otp.signIn();

  const deleteResponse = await niceBackendFetch("/api/v1/contact-channels/me/031448ab-178b-4d43-b31b-28f16c3c52a9", {
    accessType: "client",
    method: "DELETE",
  });
  expect(deleteResponse).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 400,
      "body": "Contact channel not found",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});

it("lists current user's contact channels on the client", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: true } });
  await Auth.Otp.signIn();

  const response = await niceBackendFetch("/api/v1/contact-channels?user_id=me", {
    accessType: "client",
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": {
        "is_paginated": false,
        "items": [
          {
            "id": "<stripped UUID>",
            "is_verified": true,
            "type": "email",
            "used_for_auth": true,
            "user_id": "<stripped UUID>",
            "value": "<stripped UUID>@stack-generated.example.com",
          },
        ],
      },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});


it("cannot list contact channels that is not from the current user on the client", async ({ expect }) => {
  await Project.createAndSwitch({ config: { magic_link_enabled: true } });
  await Auth.Otp.signIn();

  const response = await niceBackendFetch("/api/v1/contact-channels?user_id=031448ab-178b-4d43-b31b-28f16c3c52a9", {
    accessType: "client",
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 403,
      "body": "Client can only list contact channels for their own user.",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});