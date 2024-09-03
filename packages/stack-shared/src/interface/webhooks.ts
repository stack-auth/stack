import * as yup from "yup";
import { teamCreatedWebhookEvent, teamDeletedWebhookEvent, teamUpdatedWebhookEvent } from "./crud/teams";
import { userCreatedWebhookEvent, userDeletedWebhookEvent, userUpdatedWebhookEvent } from "./crud/users";

export type WebhookEvent<S extends yup.Schema> = {
  type: string;
  schema: S;
  metadata: {
    summary: string;
    description: string;
    tags?: string[];
  };
};

export const webhookEvents = [
  userCreatedWebhookEvent,
  userUpdatedWebhookEvent,
  userDeletedWebhookEvent,
  teamCreatedWebhookEvent,
  teamUpdatedWebhookEvent,
  teamDeletedWebhookEvent,
] as const;
