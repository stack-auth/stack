import { ensureTeamExists, ensureTeamMembershipExists, ensureUserTeamPermissionExists } from "@/lib/request-checks";
import { prismaClient } from "@/prisma-client";
import { createCrudHandlers } from "@/route-handlers/crud-handler";
import { KnownErrors } from "@stackframe/stack-shared";
import { teamInvitationCrud } from "@stackframe/stack-shared/dist/interface/crud/team-invitation";
import { yupObject, yupString } from "@stackframe/stack-shared/dist/schema-fields";
import { throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { createLazyProxy } from "@stackframe/stack-shared/dist/utils/proxies";
import { teamInvitationCodeHandler } from "./accept/verification-code-handler";

export const teamInvitationsCrudHandlers = createLazyProxy(() => createCrudHandlers(teamInvitationCrud, {
  querySchema: yupObject({
    team_id: yupString().uuid().defined().meta({ openapiField: { onlyShowInOperations: ['List'] }}),
  }),
  paramsSchema: yupObject({
    id: yupString().uuid().defined(),
  }),
  onList: async ({ auth, query }) => {
    return await prismaClient.$transaction(async (tx) => {
      if (auth.type === 'client') {
        // Client can only:
        // - list invitations in their own team if they have the $read_members AND $invite_members permissions

        const currentUserId = auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());

        await ensureTeamMembershipExists(tx, { projectId: auth.project.id, teamId: query.team_id, userId: currentUserId });

        for (const permissionId of ['$read_members', '$invite_members']) {
          await ensureUserTeamPermissionExists(tx, {
            project: auth.project,
            teamId: query.team_id,
            userId: currentUserId,
            permissionId,
            errorType: 'required',
            recursive: true,
          });
        }
      } else {
        await ensureTeamExists(tx, { projectId: auth.project.id, teamId: query.team_id });
      }

      const allCodes = await teamInvitationCodeHandler.listCodes({
        project: auth.project,
        dataFilter: {
          path: ['team_id'],
          equals: query.team_id,
        },
      });

      return {
        items: allCodes.map(code => ({
          id: code.id,
          team_id: code.data.team_id,
          expires_at_millis: code.expiresAt.getTime(),
          recipient_email: code.method.email,
        })),
        is_paginated: false,
      };
    });
  },
  onDelete: async ({ auth, query, params }) => {
    return await prismaClient.$transaction(async (tx) => {
      if (auth.type === 'client') {
        // Client can only:
        // - delete invitations in their own team if they have the $remove_members permissions

        const currentUserId = auth.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());

        await ensureTeamMembershipExists(tx, { projectId: auth.project.id, teamId: query.team_id, userId: currentUserId });

        await ensureUserTeamPermissionExists(tx, {
          project: auth.project,
          teamId: query.team_id,
          userId: currentUserId,
          permissionId: "$remove_members",
          errorType: 'required',
          recursive: true,
        });
      } else {
        await ensureTeamExists(tx, { projectId: auth.project.id, teamId: query.team_id });
      }

      await teamInvitationCodeHandler.revokeCode({
        project: auth.project,
        id: params.id,
      });
    });
  },
}));
