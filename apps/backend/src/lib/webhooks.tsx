import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { captureError } from "@stackframe/stack-shared/dist/utils/errors";

export async function sendWebhooks(options: {
  type: string,
  projectId: string,
  data: any,
}) {
  try {
    const dataString = getEnvVariable("STACK_WEBHOOK_DATA");
    const verification = getEnvVariable("STACK_WEBHOOK_VERIFICATION");
    if (!dataString) {
      return;
    }
    const data = JSON.parse(dataString);
    for (const { url, projectId } of data) {
      if (projectId !== options.projectId) {
        continue;
      }

      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: options.type,
          data: options.data,
          timestamp: Date.now(),
          verification,
        }),
      });
    }
  } catch (error) {
    captureError("Failed to send webhook", error);
  }
}