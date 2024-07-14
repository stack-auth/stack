import { it } from "../../../../helpers";
import { InternalProjectKeys, backendContext, niceBackendFetch } from "../../../backend-helpers";
import { describe } from "vitest";

it("should return an error message", async ({ expect }) => {
  const response = await niceBackendFetch("/api/v1/check-feature-support", {
    method: "POST",
    body: {
      feature_name: "some-feature"
    },
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": "some-feature is not yet supported. Please reach out to Stack support for more information.",
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});
