import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { Svix } from "svix";

export async function sendWebhooks(options: {
  type: string,
  projectId: string,
  data: any,
}) {
  const apiKey = getEnvVariable("STACK_SVIX_API_KEY");
  const server = getEnvVariable("STACK_SVIX_SERVER_URL", undefined);
  const svix = new Svix(apiKey, { serverUrl: server });

  await svix.application.getOrCreate({ uid: options.projectId, name: options.projectId });
  await svix.message.create(options.projectId, {
    eventType: options.type,
    payload: {
      type: options.type,
      data: options.data,
    },
  });
}