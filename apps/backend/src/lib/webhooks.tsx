import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { Svix } from "svix";

export async function sendWebhooks(options: {
  type: string,
  projectId: string,
  data: any,
}) {
  try {
    const dataString = getEnvVariable("STACK_WEBHOOK_DATA");
    const apiKey = getEnvVariable("STACK_SVIX_API_KEY");
    const svix = new Svix(apiKey);

    if (!dataString) {
      return;
    }
    const data = JSON.parse(dataString);
    for (const { url, projectId } of data) {
      if (projectId !== options.projectId) {
        continue;
      }

      await svix.application.getOrCreate({ uid: projectId, name: projectId });
      await svix.endpoint.create(projectId, { url });
      await svix.message.create(projectId, {
        eventType: options.type,
        payload: {
          data: options.data,
        },
      });
    }
  } catch (error) {
    captureError("Failed to send webhook", error);
  }
}