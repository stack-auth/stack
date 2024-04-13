import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { StatusError } from "@stackframe/stack-shared/dist/utils/errors";
import { deprecatedParseRequest, deprecatedSmartRouteHandler } from "@/lib/route-handlers";
import { checkApiKeySet, publishableClientKeyHeaderSchema } from "@/lib/api-keys";
import { decodeAccessToken, authorizationHeaderSchema } from "@/lib/access-token";
import { sendVerificationEmail } from "@/email";
import { getClientUser } from "@/lib/users";
import { KnownErrors } from "@stackframe/stack-shared";

const postSchema = yup.object({
  headers: yup.object({
    authorization: authorizationHeaderSchema.default(undefined),
    "x-stack-publishable-client-key": publishableClientKeyHeaderSchema.default(""),
    "x-stack-project-id": yup.string().required(),
  }).required(),
  body: yup.object({
    emailVerificationRedirectUrl: yup.string().required(),
  }).required(),
});

const handler = deprecatedSmartRouteHandler(async (req: NextRequest) => {
  const {
    headers: {
      authorization,
      "x-stack-project-id": projectId,
      "x-stack-publishable-client-key": publishableClientKey,
    },
    body: { 
      emailVerificationRedirectUrl 
    },
  } = await deprecatedParseRequest(req, postSchema);

  if (!authorization) {
    return NextResponse.json(null);
  }

  const pkValid = await checkApiKeySet(projectId, { publishableClientKey });
  if (!pkValid) {
    throw new StatusError(StatusError.Forbidden);
  }

  const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
  const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

  if (accessTokenProjectId !== projectId) {
    throw new StatusError(StatusError.Forbidden);
  }

  const user = await getClientUser(projectId, userId);
  if (!user) {
    throw new StatusError(StatusError.NotFound);
  }
  if (user.primaryEmailVerified) {
    throw new KnownErrors.EmailAlreadyVerified();
  }
  try {
    await sendVerificationEmail(projectId, userId, emailVerificationRedirectUrl);
  } catch (e) {
    console.error(e);
    throw e;
  }
  return NextResponse.json({});
});
export const POST = handler;
