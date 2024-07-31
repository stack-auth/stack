import { teamCreatedWebhookEvent, teamDeletedWebhookEvent, teamUpdatedWebhookEvent } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { userCreatedWebhookEvent, userDeletedWebhookEvent, userUpdatedWebhookEvent } from "@stackframe/stack-shared/dist/interface/crud/users";
import { WebhookEvent } from "@stackframe/stack-shared/dist/interface/webhooks";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { Svix } from "svix";
import * as yup from "yup";

async function sendWebhooks(options: {
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

function createWebhookSender<T extends yup.Schema>(event: WebhookEvent<T>) {
  return async (options: { projectId: string, data: yup.InferType<typeof event.schema> }) => {
    await sendWebhooks({
      type: event.type,
      projectId: options.projectId,
      data: options.data,
    });
  };
}

type x = yup.InferType<typeof userUpdatedWebhookEvent.schema>;

export const sendUserCreatedWebhook = createWebhookSender(userCreatedWebhookEvent);
export const sendUserUpdatedWebhook = createWebhookSender(userUpdatedWebhookEvent);
export const sendUserDeletedWebhook = createWebhookSender(userDeletedWebhookEvent);
export const sendTeamCreatedWebhook = createWebhookSender(teamCreatedWebhookEvent);
export const sendTeamUpdatedWebhook = createWebhookSender(teamUpdatedWebhookEvent);
export const sendTeamDeletedWebhook = createWebhookSender(teamDeletedWebhookEvent);