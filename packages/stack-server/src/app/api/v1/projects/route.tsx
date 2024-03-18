import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler, deprecatedParseRequest } from "@/lib/route-handlers";
import { createProject, listProjects } from "@/lib/projects";
import { authorizationHeaderSchema, decodeAccessToken } from "@/lib/access-token";
import { getServerUser } from "@/lib/users";


const getRequestSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
  }),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: { authorization },
  } = await deprecatedParseRequest(req, getRequestSchema);

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(authorization.split(" ")[1]);
  if (accessTokenProjectId !== "internal") {
    throw new StatusError(StatusError.Forbidden, "Must be an internal project user to access the dashboard");
  }

  const projectUser = await getServerUser("internal", userId);
  if (!projectUser) {
    throw new StatusError(StatusError.Forbidden, "Invalid project user");
  }

  const projects = await listProjects(projectUser);

  return NextResponse.json(projects);
});


const postRequestSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
  }),
  body: yup.object({
    displayName: yup.string().required(),
    description: yup.string().default(undefined),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: { authorization },
    body: { displayName, description },
  } = await deprecatedParseRequest(req, postRequestSchema);

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(authorization.split(" ")[1]);
  if (accessTokenProjectId !== "internal") {
    throw new StatusError(StatusError.Forbidden, "Must be an internal project user to access the dashboard");
  }

  const projectUser = await getServerUser("internal", userId);
  if (!projectUser) {
    throw new StatusError(StatusError.Forbidden, "Invalid project user");
  }

  const project = await createProject(projectUser, { displayName, description });

  return NextResponse.json(project);
});
