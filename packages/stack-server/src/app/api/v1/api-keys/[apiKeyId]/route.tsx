import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, getApiKeySet, revokeApiKeySet, superSecretAdminKeyHeaderSchema } from "@/lib/api-keys";
import { isProjectAdmin } from "@/lib/projects";

const putOrGetSchema = yup.object({
  headers: yup.object({
    "x-stack-super-secret-admin-key": superSecretAdminKeyHeaderSchema.default(""),
    "x-stack-admin-access-token": yup.string().default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    revoke: yup.boolean().default(false),
  }).nullable(),
});

const handler = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { apiKeyId: string } }) => {
  const {
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-super-secret-admin-key": superSecretAdminKey,
      "x-stack-admin-access-token": adminAccessToken,
    },
    body,
  } = await deprecatedParseRequest(req, putOrGetSchema);

  let {
    revoke
  } = body ?? {};

  const apiKeyId = options.params.apiKeyId;

  if (!await checkApiKeySet(projectId, { superSecretAdminKey }) && !await isProjectAdmin(projectId, adminAccessToken)) {
    throw new StatusError(StatusError.Forbidden, "Invalid API key");
  }

  let apiKey;
  if (revoke) {
    apiKey = await revokeApiKeySet(projectId, apiKeyId);
  } else {
    apiKey = await getApiKeySet(
      projectId,
      apiKeyId,
    );
  }

  return NextResponse.json(apiKey);
});
export const GET = handler;
export const PUT = handler;
export const DELETE = handler;
