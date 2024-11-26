import { CrudTypeOf, createCrud } from "../../crud";
import * as fieldSchema from "../../schema-fields";
import { yupObject } from "../../schema-fields";
import { WebhookEvent } from "../webhooks";

// Read
export const teamsCrudClientReadSchema = yupObject({
  id: fieldSchema.teamIdSchema.defined(),
  display_name: fieldSchema.teamDisplayNameSchema.defined(),
  profile_image_url: fieldSchema.teamProfileImageUrlSchema.nullable().defined(),
  client_metadata: fieldSchema.teamClientMetadataSchema.optional(),
  client_read_only_metadata: fieldSchema.teamClientReadOnlyMetadataSchema.optional(),
}).defined();
export const teamsCrudServerReadSchema = teamsCrudClientReadSchema.concat(yupObject({
  created_at_millis: fieldSchema.teamCreatedAtMillisSchema.defined(),
  server_metadata: fieldSchema.teamServerMetadataSchema.optional(),
}).defined());

// Update
export const teamsCrudClientUpdateSchema = yupObject({
  display_name: fieldSchema.teamDisplayNameSchema.optional(),
  profile_image_url: fieldSchema.teamProfileImageUrlSchema.nullable().optional(),
  client_metadata: fieldSchema.teamClientMetadataSchema.optional(),
}).defined();
export const teamsCrudServerUpdateSchema = teamsCrudClientUpdateSchema.concat(yupObject({
  client_read_only_metadata: fieldSchema.teamClientReadOnlyMetadataSchema.optional(),
  server_metadata: fieldSchema.teamServerMetadataSchema.optional(),
}).defined());

// Create
export const teamsCrudClientCreateSchema = teamsCrudClientUpdateSchema.concat(yupObject({
  display_name: fieldSchema.teamDisplayNameSchema.defined(),
  creator_user_id: fieldSchema.teamCreatorUserIdSchema.optional(),
}).defined());
export const teamsCrudServerCreateSchema = teamsCrudServerUpdateSchema.concat(yupObject({
  display_name: fieldSchema.teamDisplayNameSchema.defined(),
  creator_user_id: fieldSchema.teamCreatorUserIdSchema.optional(),
}).defined());

// Delete
export const teamsCrudClientDeleteSchema = fieldSchema.yupMixed();
export const teamsCrudServerDeleteSchema = teamsCrudClientDeleteSchema;

export const teamsCrud = createCrud({
  // Client
  clientReadSchema: teamsCrudClientReadSchema,
  clientUpdateSchema: teamsCrudClientUpdateSchema,
  clientCreateSchema: teamsCrudClientCreateSchema,
  clientDeleteSchema: teamsCrudClientDeleteSchema,
  // Server
  serverReadSchema: teamsCrudServerReadSchema,
  serverUpdateSchema: teamsCrudServerUpdateSchema,
  serverCreateSchema: teamsCrudServerCreateSchema,
  serverDeleteSchema: teamsCrudServerDeleteSchema,
  docs: {
    clientList: {
      summary: "List teams",
      description: "List all the teams that the current user is a member of. `user_id=me` must be passed in the query parameters.",
      tags: ["Teams"],
    },
    clientCreate: {
      summary: "Create a team",
      description: "Create a new team and optionally add the current user as a member.",
      tags: ["Teams"],
    },
    clientRead: {
      summary: "Get a team",
      description: "Get a team that the current user is a member of.",
      tags: ["Teams"],
    },
    clientUpdate: {
      summary: "Update a team",
      description: "Update the team information. Only allowed if the current user is a member of the team and has the `$update_team` permission.",
      tags: ["Teams"],
    },
    clientDelete: {
      summary: "Delete a team",
      description: "Delete a team. Only allowed if the current user is a member of the team and has the `$delete_team` permission.",
      tags: ["Teams"],
    },
    serverCreate: {
      summary: "Create a team",
      description: "Create a new team and optionally add the current user as a member.",
      tags: ["Teams"],
    },
    serverList: {
      summary: "List teams",
      description: "List all the teams in the project.",
      tags: ["Teams"],
    },
    serverRead: {
      summary: "Get a team",
      description: "Get a team by ID.",
      tags: ["Teams"],
    },
    serverUpdate: {
      summary: "Update a team",
      description: "Update the team information by ID.",
      tags: ["Teams"],
    },
    serverDelete: {
      summary: "Delete a team",
      description: "Delete a team by ID.",
      tags: ["Teams"],
    },
  },
});
export type TeamsCrud = CrudTypeOf<typeof teamsCrud>;

export const teamCreatedWebhookEvent = {
  type: "team.created",
  schema: teamsCrud.server.readSchema,
  metadata: {
    summary: "Team Created",
    description: "This event is triggered when a team is created.",
    tags: ["Teams"],
  },
} satisfies WebhookEvent<typeof teamsCrud.server.readSchema>;

export const teamUpdatedWebhookEvent = {
  type: "team.updated",
  schema: teamsCrud.server.readSchema,
  metadata: {
    summary: "Team Updated",
    description: "This event is triggered when a team is updated.",
    tags: ["Teams"],
  },
} satisfies WebhookEvent<typeof teamsCrud.server.readSchema>;

const webhookTeamDeletedSchema = fieldSchema.yupObject({
  id: fieldSchema.userIdSchema.defined(),
}).defined();

export const teamDeletedWebhookEvent = {
  type: "team.deleted",
  schema: webhookTeamDeletedSchema,
  metadata: {
    summary: "Team Deleted",
    description: "This event is triggered when a team is deleted.",
    tags: ["Teams"],
  },
} satisfies WebhookEvent<typeof webhookTeamDeletedSchema>;
