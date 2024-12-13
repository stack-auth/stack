import { describe } from "vitest";
import { it } from "../../../../helpers";
import { backendContext, InternalProjectKeys, niceBackendFetch, Project } from "../../../backend-helpers";

describe("/internal/metrics route", () => {
  backendContext.set({ projectKeys: InternalProjectKeys });

  it("should return metrics data", async ({ expect }) => {
    await Project.createAndSwitch({});
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
        "activity": 0,
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
        "activity": 0,
        "date": <stripped field 'date'>,
      },
    ],
    "login_methods": [],
    "recently_active": [],
    "recently_registered": [],
    "total_users": 0,
    "users_by_country": {},
  },
  "headers": Headers { <some fields may have been hidden> },
}
    `);
  });
});
