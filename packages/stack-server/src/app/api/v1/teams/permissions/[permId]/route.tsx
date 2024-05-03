import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";
import { deletePermission, updatePermission } from "@/lib/permissions";

const putSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    id: yup.string(),
    description: yup.string(),
    inheritFromPermissionIds: yup.array(yup.string().required()),
  }).required(),
});

export const PUT = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { permId: string } }) => {
  const {
    query: {
      server,
    },
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    body,
  } = await deprecatedParseRequest(req, putSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    await updatePermission(
      projectId, 
      { type: "any-team" },
      options.params.permId,
      body
    );
  }

  return NextResponse.json(null);
});


const deleteSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true"]).required(),
  }).required(),
  headers: yup.object({
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const DELETE = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { permId: string } }) => {
  const {
    query: {
      server,
    },
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-secret-server-key": secretServerKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
  } = await deprecatedParseRequest(req, deleteSchema);

  const skValid = await checkApiKeySet(projectId, { secretServerKey });
  const asValid = await isProjectAdmin(projectId, adminAccessToken);

  if (server === "true") {
    if (!skValid && !asValid) {
      throw new StatusError(StatusError.Forbidden);
    }

    await deletePermission(
      projectId, 
      { type: "any-team" },
      options.params.permId
    );
  }

  return NextResponse.json(null);
});