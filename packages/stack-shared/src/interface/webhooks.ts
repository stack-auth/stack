import * as yup from "yup";
import { usersCrud } from "./crud-deprecated/users";
import { teamsCrud } from "./crud/teams";

export type WebhookEvent<S extends yup.Schema> = {
  type: string,
  schema: S,
  metadata: {
    summary: string,
    description: string,
    tags?: string[],
  },
};

export const userCreatedWebhookEvent = {
  type: "user.created",
  schema: usersCrud.server.createSchema,
  metadata: {
    summary: "User Created",
    description: "This event is triggered when a user is created.",
    tags: ["Users"],
  },
} satisfies WebhookEvent<typeof usersCrud.server.createSchema>;

export const userUpdatedWebhookEvent = {
  type: "user.updated",
  schema: usersCrud.server.updateSchema,
  metadata: {
    summary: "User Updated",
    description: "This event is triggered when a user is updated.",
    tags: ["Users"],
  },
} satisfies WebhookEvent<typeof usersCrud.server.updateSchema>;

export const userDeletedWebhookEvent = {
  type: "user.deleted",
  schema: usersCrud.server.deleteSchema,
  metadata: {
    summary: "User Deleted",
    description: "This event is triggered when a user is deleted.",
    tags: ["Users"],
  },
} satisfies WebhookEvent<typeof usersCrud.server.deleteSchema>;

export const teamCreatedWebhookEvent = {
  type: "team.created",
  schema: teamsCrud.server.createSchema,
  metadata: {
    summary: "Team Created",
    description: "This event is triggered when a team is created.",
    tags: ["Teams"],
  },
} satisfies WebhookEvent<typeof teamsCrud.server.createSchema>;

export const teamUpdatedWebhookEvent = {
  type: "team.updated",
  schema: teamsCrud.server.updateSchema,
  metadata: {
    summary: "Team Updated",
    description: "This event is triggered when a team is updated.",
    tags: ["Teams"],
  },
} satisfies WebhookEvent<typeof teamsCrud.server.updateSchema>;

export const teamDeletedWebhookEvent = {
  type: "team.deleted",
  schema: teamsCrud.server.deleteSchema,
  metadata: {
    summary: "Team Deleted",
    description: "This event is triggered when a team is deleted.",
    tags: ["Teams"],
  },
} satisfies WebhookEvent<typeof teamsCrud.server.deleteSchema>;

export const webhookEvents = [
  userCreatedWebhookEvent,
  userUpdatedWebhookEvent,
  userDeletedWebhookEvent,
  teamCreatedWebhookEvent,
  teamUpdatedWebhookEvent,
  teamDeletedWebhookEvent,
] as const;