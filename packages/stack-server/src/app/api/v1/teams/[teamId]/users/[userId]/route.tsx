import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { decodeAccessToken, authorizationHeaderSchema } from "@/lib/tokens";
import { addUserToTeam, getTeam, listUserTeams } from "@/lib/teams";
import { getClientUser } from "@/lib/users";
import { isProjectAdmin } from "@/lib/projects";

// const getSchema = yup.object({
//   headers: yup.object({
//     authorization: authorizationHeaderSchema.required(),
//     "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.required(),
//     "x-stack-project-id": yup.string().required(),
//   }).required(),
//   body: yup.object({
//     permissions: yup.array(yup.string().required()).nullable(),
//   }).nullable(),
// });

// const handler = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
//   const {
//     headers: {
//       authorization,
//       "x-stack-project-id": projectId,
//       "x-stack-publishable-client-key": publishableClientKey,
//     },
//     body
//   } = await deprecatedParseRequest(req, getSchema);

//   if (!await checkApiKeySet(projectId, { publishableClientKey })) {
//     throw new StatusError(StatusError.Forbidden);
//   }

//   const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
//   const { userId: currentUserId, projectId: accessTokenProjectId } = decodedAccessToken;

//   if (accessTokenProjectId !== projectId) {
//     throw new StatusError(StatusError.NotFound);
//   }

//   // if (!hasPermission(currentUserId, projectId, teamId, Permission.ReadTeamUsers)) {
//   //   throw new StatusError(StatusError.Forbidden);
//   // }

//   // if (body && !hasPermission(currentUserId, projectId, teamId, Permission.UpdateTeamUserPermissions)) {
//   //   throw new StatusError(StatusError.Forbidden);
//   // }
  
//   // await updateTeamUserPermissions(currentUserId, projectId, teamId, userId, body);
//   return NextResponse.json({});
// });

// export const GET = handler;

const postSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    query: { server },
  } = await deprecatedParseRequest(req, postSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    const team = await getTeam(projectId, options.params.teamId);
    if (!team) {
      throw new StatusError(StatusError.NotFound, "Team not found");
    }

    const user = await getClientUser(projectId, options.params.userId);
    if (!user) {
      throw new StatusError(StatusError.NotFound, "User not found");
    }

    const userTeams = await listUserTeams(projectId, options.params.userId);
    if (userTeams.some(t => t.id === options.params.teamId)) {
      throw new StatusError(StatusError.BadRequest, "User is already in the team");
    }

    await addUserToTeam(projectId, options.params.teamId, options.params.userId);
  }

  return NextResponse.json(null);
});


// const deleteSchema = yup.object({
//   method: yup.string().oneOf(["DELETE"]).required(),
//   headers: yup.object({
//     authorization: authorizationHeaderSchema.required(),
//     "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.required(),
//     "x-stack-project-id": yup.string().required(),
//   }).required(),
// });

// export const DELETE = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { teamId: string, userId: string } }) => {
//   const {
//     method,
//     headers: {
//       authorization,
//       "x-stack-project-id": projectId,
//       "x-stack-publishable-client-key": publishableClientKey,
//     },
//   } = await deprecatedParseRequest(req, deleteSchema);

//   if (!authorization) {
//     return NextResponse.json(null);
//   }

//   if (!await checkApiKeySet(projectId, { publishableClientKey })) {
//     throw new StatusError(StatusError.Forbidden);
//   }

//   const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
//   const { userId: currentUserId, projectId: accessTokenProjectId } = decodedAccessToken;

//   if (accessTokenProjectId !== projectId) {
//     throw new StatusError(StatusError.NotFound);
//   }

//   // if (userId !== currentUserId && !hasPermission(currentUserId, projectId, teamId, Permission.RemoveTeamUser)) {
//   //   throw new StatusError(StatusError.Forbidden);
//   // }
  
//   // await removeUserFromTeam(projectId, teamId, userId);
//   return NextResponse.json({});
// });