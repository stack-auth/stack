import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import {
  createProject,
  deleteProject,
  getProjectCreateSchema,
  getProjectUpdateSchema,
  listProjects,
  projectSchemaToCreateOptions,
  projectSchemaToUpdateOptions,
} from "@/lib/projects";
import { authorizationHeaderSchema, decodeAccessToken } from "@/lib/tokens";
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

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(
    authorization.split(" ")[1]
  );
  if (accessTokenProjectId !== "internal") {
    throw new StatusError(
      StatusError.Forbidden,
      "Must be an internal project user to access the dashboard"
    );
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
  body: getProjectCreateSchema().required(),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: { authorization },
    body,
  } = await deprecatedParseRequest(req, postRequestSchema);

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(
    authorization.split(" ")[1]
  );
  if (accessTokenProjectId !== "internal") {
    throw new StatusError(
      StatusError.Forbidden,
      "Must be an internal project user to access the dashboard"
    );
  }

  const projectUser = await getServerUser("internal", userId);
  if (!projectUser) {
    throw new StatusError(StatusError.Forbidden, "Invalid project user");
  }

  const { ...update } = body;
  const typedUpdate = projectSchemaToCreateOptions(update);
  const project = await createProject(projectUser, typedUpdate);

  return NextResponse.json(project);
});

const authorizationHeaderSchemadelete = yup.string().required();

// Define your request schema using yup
const deleteRequestSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchemadelete,
  }).required(),
  body: yup.object({
    projectId: yup.string().required(),
  }).required(),
});

// DELETE route handler
export const DELETE = deprecatedSmartRouteHandler(async (req: NextRequest) => {
    // Parse and validate the request using the deleteRequestSchema
    const {
      headers: { authorization },
      body,
    } = await deprecatedParseRequest(req, deleteRequestSchema);

    // Decode the access token to get userId and accessTokenProjectId
    const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(
      authorization.split(" ")[1] // Assuming authorization header format is "Bearer <token>"
    );

    // Ensure the user is authorized to delete projects
    if (accessTokenProjectId !== "internal") {
      throw new StatusError(
        StatusError.Forbidden,
        "Must be an internal project user to delete projects"
      );
    }

    // Fetch the project user from the server
    const projectUser = await getServerUser("internal", userId);
    if (!projectUser) {
      throw new StatusError(StatusError.Forbidden, "Invalid project user");
    }

    // Call the deleteProject function with the authenticated user and projectId
    await deleteProject(projectUser, body.projectId);

    // Return a success response
    return NextResponse.json(
      { message: "Project deleted successfully" },
      { status: 200 }
    );
});

