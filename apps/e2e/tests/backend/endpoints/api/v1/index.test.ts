import { describe, expect, test } from "vitest";
import { niceBackendFetch } from "../../../backend-helpers";

describe("Backend index page", () => {
  test("Main Page", async () => {
    const response = await niceBackendFetch("/api/v1");
    expect(response).toMatchInlineSnapshot(`
      NiceResponse {
        "status": 200,
        "headers": Headers {
          "x-stack-request-id": <stripped header 'x-stack-request-id'>,
          <several headers hidden>,
        },
        "body": "Welcome to the Stack API endpoint! Please refer to the documentation at https://docs.stack-auth.com.\\n\\nAuthentication: None",
      }
    `);
  });
});
