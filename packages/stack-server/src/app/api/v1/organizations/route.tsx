import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler, deprecatedParseRequest } from "@/lib/route-handlers";
import { authorizationHeaderSchema, decodeAccessToken } from "@/lib/tokens";


const getSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-project-id": yup.string().required(),
  }),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: { authorization },
  } = await deprecatedParseRequest(req, getSchema);

  const {
    headers: {
      "x-stack-project-id": projectId,
    },
  } = await deprecatedParseRequest(req, getSchema);

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(authorization.split(" ")[1]);
  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.Forbidden, "Invalid project ID");
  }
  
  // const organizations = await listOrganizations(userId);

  return NextResponse.json({});
});


const postSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.required(),
    "x-stack-project-id": yup.string().required(),
  }),
  body: yup.object({
    displayName: yup.string().required(),
  }),
});

export const POST = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: { authorization, "x-stack-project-id": projectId },
    body: { displayName },
  } = await deprecatedParseRequest(req, postSchema);

  const { userId, projectId: accessTokenProjectId } = await decodeAccessToken(authorization.split(" ")[1]);

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.Forbidden, "Invalid project ID");
  }

  // const organization = await createOrganization(userId, { displayName });

  return NextResponse.json({});
});
