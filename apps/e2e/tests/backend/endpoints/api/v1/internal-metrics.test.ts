import { describe } from "vitest";
import { createMailbox, it } from "../../../../helpers";
import { Auth, backendContext, niceBackendFetch, Project } from "../../../backend-helpers";

describe("/internal/metrics route", () => {
  it("should return metrics data", async ({ expect }) => {
    await Project.createAndSwitch({
      config: {
        magic_link_enabled: true,
      }
    });

    // loop 10 times
    for (let i = 0; i < 10; i++) {
      backendContext.set({ mailbox: createMailbox() });
      await Auth.Otp.signIn();
    }

    const response = await niceBackendFetch("/api/v1/internal/metrics", { accessType: 'admin' });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "body": {
          "daily_active_users": [
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 10,
              "date": <stripped field 'date'>,
            },
          ],
          "daily_users": [
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 0,
              "date": <stripped field 'date'>,
            },
            {
              "activity": 10,
              "date": <stripped field 'date'>,
            },
          ],
          "login_methods": [
            {
              "count": 10,
              "method": "other",
            },
          ],
          "recently_active": [
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
          ],
          "recently_registered": [
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
            {
              "created_at_millis": <stripped field 'created_at_millis'>,
              "display_name": null,
              "email": "<stripped UUID>@stack-generated.example.com",
              "id": "<stripped UUID>",
              "updated_at_millis": <stripped field 'updated_at_millis'>,
            },
          ],
          "total_users": 10,
          "users_by_country": {},
        },
        "headers": Headers { <some fields may have been hidden> },
      }
    `);
  });
});
