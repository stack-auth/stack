import { CrudTypeOf, createCrud } from "../../crud";
import * as schemaFields from "../../schema-fields";
import { yupObject } from "../../schema-fields";

export const teamInvitationDetailsClientReadSchema = yupObject({
  team_id: schemaFields.teamIdSchema.required(),
  team_display_name: schemaFields.teamDisplayNameSchema.required(),
}).required();

export const teamInvitationDetailsCrud = createCrud({
  clientReadSchema: teamInvitationDetailsClientReadSchema,
  docs: {
    clientRead: {
      summary: "Get the team details with invitation code",
      description: "",
      tags: ["Teams"],
    },
  },
});

export type TeamInvitationDetailsCrud = CrudTypeOf<typeof teamInvitationDetailsCrud>;
