import { it } from "../../../../../../helpers";
import { niceBackendFetch } from "../../../../../backend-helpers";
import { provisionProject } from "./projects/provision.test";


it("should be able to create a webhook", async ({ expect }) => {
  await provisionProject();
  const response = await niceBackendFetch("/api/v1/integrations/neon/webhooks", {
    method: "POST",
    body: {
      url: "https://example.com/neon",
      description: "Test webhook",
    },
    headers: {
      "Authorization": "Basic bmVvbi1sb2NhbDpuZW9uLWxvY2FsLXNlY3JldA==",
    },
    accessType: "admin",
  });
  expect(response).toMatchInlineSnapshot(`
    NiceResponse {
      "status": 200,
      "body": { "secret": <stripped field 'secret'> },
      "headers": Headers { <some fields may have been hidden> },
    }
  `);
});
