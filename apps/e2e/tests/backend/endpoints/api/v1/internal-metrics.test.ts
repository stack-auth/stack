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

    const response = await niceBackendFetch("/api/v1/internal/metrics", { accessType: 'admin' });
    expect(response).matchSnapshot();
  });

  it("should return metrics data with users", async ({ expect }) => {
    await Project.createAndSwitch({
      config: {
        magic_link_enabled: true,
      }
    });

    for (let i = 0; i < 15; i++) {
      backendContext.set({ mailbox: createMailbox() });
      await Auth.Otp.signIn();
    }

    const response = await niceBackendFetch("/api/v1/internal/metrics", { accessType: 'admin' });
    expect(response).matchSnapshot();
  });

  it("should not work for non-admins", async ({ expect }) => {
    await Project.createAndSwitch({
      config: {
        magic_link_enabled: true,
      }
    });

    await Auth.Otp.signIn();

    const response = await niceBackendFetch("/api/v1/internal/metrics", { accessType: 'client' });
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 401,
        "body": {
          "code": "INSUFFICIENT_ACCESS_TYPE",
          "details": {
            "actual_access_type": "client",
            "allowed_access_types": ["admin"],
          },
          "error": "The x-stack-access-type header must be 'admin', but was 'client'.",
        },
        "headers": Headers {
          "x-stack-known-error": "INSUFFICIENT_ACCESS_TYPE",
          <some fields may have been hidden>,
        },
      }
    `);
  });
});
