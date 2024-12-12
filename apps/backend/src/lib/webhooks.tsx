import { teamMembershipCreatedWebhookEvent, teamMembershipDeletedWebhookEvent } from "@stackframe/stack-shared/dist/interface/crud/team-memberships";
import { teamCreatedWebhookEvent, teamDeletedWebhookEvent, teamUpdatedWebhookEvent } from "@stackframe/stack-shared/dist/interface/crud/teams";
import { userCreatedWebhookEvent, userDeletedWebhookEvent, userUpdatedWebhookEvent } from "@stackframe/stack-shared/dist/interface/crud/users";
import { WebhookEvent } from "@stackframe/stack-shared/dist/interface/webhooks";
import { getEnvVariable } from "@stackframe/stack-shared/dist/utils/env";
import { StackAssertionError, captureError } from "@stackframe/stack-shared/dist/utils/errors";
import { Result } from "@stackframe/stack-shared/dist/utils/results";
import { Svix } from "svix";
import * as yup from "yup";

export function getSvixClient(projectId: string) {
  return new Svix(
    getEnvVariable("STACK_SVIX_API_KEY"),
    { serverUrl: getEnvVariable("STACK_SVIX_SERVER_URL", "") || undefined }
  );
}

async function sendWebhooks(options: {
  type: string,
  projectId: string,
  data: any,
}) {
  const apiKey = getEnvVariable("STACK_SVIX_API_KEY");
  const server = getEnvVariable("STACK_SVIX_SERVER_URL", "") || undefined;
  const svix = new Svix(apiKey, { serverUrl: server });

  try {
    await svix.application.getOrCreate({ uid: options.projectId, name: options.projectId });
  } catch (e: any) {
    if (e.message.includes("409")) {
      // This is a Svix bug; they are working on fixing it
      // TODO next-release: remove this once it no longer appears on Sentry
      captureError("svix-409-hack", "Svix bug: 409 error when creating application. Remove this warning once Svix fixes this.");
    } else {
      throw e;
    }
  }
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
    await Result.retry(async () => {
      try {
        return Result.ok(await sendWebhooks({
          type: event.type,
          projectId: options.projectId,
          data: options.data,
        }));
      } catch (e) {
        if (typeof e === "object" && e !== null && "code" in e && e.code === "429") {
          // Rate limit. Let's retry later
          return Result.error(e);
        }
        throw new StackAssertionError("Error sending Svix webhook!", { event: event.type, data: options.data, cause: e });
      }
    }, 5);
  };
}

export const sendUserCreatedWebhook = createWebhookSender(userCreatedWebhookEvent);
export const sendUserUpdatedWebhook = createWebhookSender(userUpdatedWebhookEvent);
export const sendUserDeletedWebhook = createWebhookSender(userDeletedWebhookEvent);
export const sendTeamCreatedWebhook = createWebhookSender(teamCreatedWebhookEvent);
export const sendTeamUpdatedWebhook = createWebhookSender(teamUpdatedWebhookEvent);
export const sendTeamDeletedWebhook = createWebhookSender(teamDeletedWebhookEvent);
export const sendTeamMembershipCreatedWebhook = createWebhookSender(teamMembershipCreatedWebhookEvent);
export const sendTeamMembershipDeletedWebhook = createWebhookSender(teamMembershipDeletedWebhookEvent);
