import { CrudTypeOf, createCrud } from "../../crud";
import { yupMixed, yupObject, yupString } from "../../schema-fields";
import { WebhookEvent } from "../webhooks";

export const teamMembershipsCrudClientReadSchema = yupObject({
  team_id: yupString().defined(),
  user_id: yupString().defined(),
}).defined();
export const teamMembershipsCrudServerCreateSchema = yupObject({}).defined();
export const teamMembershipsCrudClientDeleteSchema = yupMixed();

export const teamMembershipsCrud = createCrud({
  // Client
  clientReadSchema: teamMembershipsCrudClientReadSchema,
  clientDeleteSchema: teamMembershipsCrudClientDeleteSchema,
  // Server
  serverCreateSchema: teamMembershipsCrudServerCreateSchema,
  docs: {
    serverCreate: {
      summary: "Add a user to a team",
      description: "",
      tags: ["Teams"],
    },
    clientDelete: {
      summary: "Remove a user from a team",
      description: "All the users are allowed to remove themselves from a team (`user_id=me`). Only the users who have the `$remove_members` permission are allowed to remove other users from a team. `team_id` is must an ID of a team that the user is a member of.",
      tags: ["Teams"],
    },
    serverDelete: {
      summary: "Remove a user from a team",
      description: "",
      tags: ["Teams"],
    },
  },
});
export type TeamMembershipsCrud = CrudTypeOf<typeof teamMembershipsCrud>;

export const teamMembershipCreatedWebhookEvent = {
  type: "team_membership.created",
  schema: teamMembershipsCrud.server.readSchema,
  metadata: {
    summary: "Team Membership Created",
    description: "This event is triggered when a user is added to a team.",
    tags: ["Teams"],
  },
} satisfies WebhookEvent<typeof teamMembershipsCrud.server.readSchema>;

export const teamMembershipDeletedWebhookEvent = {
  type: "team_membership.deleted",
  schema: teamMembershipsCrud.server.readSchema,
  metadata: {
    summary: "Team Membership Deleted",
    description: "This event is triggered when a user is removed from a team.",
    tags: ["Teams"],
  },
} satisfies WebhookEvent<typeof teamMembershipsCrud.server.readSchema>;
