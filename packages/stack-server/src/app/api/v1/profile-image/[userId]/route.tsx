import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedSmartRouteHandler } from "@/route-handlers/smart-route-handler";
import { deprecatedParseRequest } from "@/route-handlers/smart-request";
import { checkApiKeySet, publishableClientKeyHeaderSchema, secretServerKeyHeaderSchema } from "@/lib/api-keys";
import { getUserImage } from "@/lib/image";

const getSchema = yup.object({
  query: yup.object({
    server: yup.string().oneOf(["true", "false"]).default("false"),
  }).required(),
  headers: yup.object({
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-secret-server-key": secretServerKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
});

export const GET = deprecatedSmartRouteHandler(async (req: NextRequest, options: { params: { userId: string } }) => {
  const {
    query: {
      server,
    },
    headers: {
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
      "x-stack-secret-server-key": secretServerKey,
    },
  } = await deprecatedParseRequest(req, getSchema);

  const pkValid = await checkApiKeySet(projectId, { publishableClientKey });
  const skValid = await checkApiKeySet(projectId, { secretServerKey });

  if (!pkValid && !skValid) {
    throw new StatusError(StatusError.Forbidden);
  }

  if (server === "true") {
    if (!skValid) {
      throw new StatusError(StatusError.Forbidden, "Secret server key is invalid");
    }
  } else {
    if (!pkValid) {
      throw new StatusError(StatusError.Forbidden, "Publishable client key is invalid");
    }
  }
  const imageData = await getUserImage(options.params.userId);
  return NextResponse.json(imageData);
});