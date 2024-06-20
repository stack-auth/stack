import "../polyfills";

import { NextRequest } from "next/server";
import { StackAssertionError, StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";
import { DeepPartial } from "@stackframe/stack-shared/dist/utils/objects";
import { groupBy, typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { KnownErrors, ProjectJson, ServerUserJson } from "@stackframe/stack-shared";
import { IsAny } from "@stackframe/stack-shared/dist/utils/types";
import { checkApiKeySet } from "@/lib/api-keys";
import { updateProject, whyNotProjectAdmin } from "@/lib/projects";
import { updateServerUser } from "@/lib/users";
import { decodeAccessToken } from "@/lib/tokens";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";

const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

export type SmartRequestAuth = {
  project: ProjectJson,
  user: ServerUserJson | undefined,
  projectAccessType: "key" | "internal-user-token",
  type: "client" | "server" | "admin",
};

declare const SmartRequestAdaptSentinel: unique symbol;
export type SmartRequestAdaptSentinel = typeof SmartRequestAdaptSentinel;

export type DeepPartialSmartRequestWithSentinel<T = SmartRequest> = (T extends object ? {
  [P in keyof T]?: DeepPartialSmartRequestWithSentinel<T[P]>
} : T) | SmartRequestAdaptSentinel;

export type SmartRequest = {
  auth: SmartRequestAuth | null,
  url: string,
  method: typeof allowedMethods[number],
  body: unknown,
  headers: Record<string, string[]>,
  query: Record<string, string>,
  params: Record<string, string>,
};

export type MergeSmartRequest<T, MSQ = SmartRequest> =
  T extends SmartRequestAdaptSentinel ? NonNullable<MSQ> : (IsAny<T> extends true ? MSQ : (
    T extends object ? (MSQ extends object ? { [K in keyof T]: K extends keyof MSQ ? MergeSmartRequest<T[K], MSQ[K]> : undefined } : (T & MSQ))
    : (T & MSQ)
  ));

/*
// TODO ASAP remove before merging this to dev
// the code below might help you debug & understand the types above
type T = MergeSmartRequest<{ a: 1 | 2 }, { a?: 2 | 3 | undefined } | null>;

const mixed = yup.object({
  auth: yup.object({
    type: yup.mixed<12345>().required(),
    user: yup.mixed(),
    project: yup.mixed(),
  }).nullable(),
  method: yup.string().oneOf(["GET"]).required(),
});
const mx = yup.mixed<12345>();
type Y = yup.InferType<typeof mixed>;
type Y2 = yup.InferType<typeof mx>;
type Z = MergeSmartRequest<Y, { auth: { type: "client" | "server" | undefined } | null }>;
*/

async function validate<T>(obj: unknown, schema: yup.Schema<T>, req: NextRequest): Promise<T> {
  try {
    return await schema.validate(obj, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const inners = error.inner.length ? error.inner : [error];
      const description = schema.describe();
      
      for (const inner of inners) {
        if (inner.path === "auth" && inner.type === "nullable" && inner.value === null) {
          throw new KnownErrors.AccessTypeRequired();
        }
        if (inner.path === "auth.type" && inner.type === "oneOf") {
          // Project access type not sufficient
          const authTypeField = ((description as yup.SchemaObjectDescription).fields["auth"] as yup.SchemaObjectDescription).fields["type"] as yup.SchemaDescription;
          throw new KnownErrors.InsufficientAccessType(inner.value, authTypeField.oneOf as any[]);
        }
      }

      throw new KnownErrors.SchemaError(
        deindent`
          Request validation failed on ${req.method} ${req.nextUrl.pathname}:
            ${inners.map(e => deindent`
              - ${e.message}
            `).join("\n")}
        `,
      );
    }
    throw error;
  }
}


async function parseBody(req: NextRequest, bodyBuffer: ArrayBuffer): Promise<SmartRequest["body"]> {
  const contentType = req.headers.get("content-type")?.split(";")[0];

  const getText = () => {
    try {
      return new TextDecoder().decode(bodyBuffer);
    } catch (e) {
      throw new KnownErrors.BodyParsingError("Request body cannot be parsed as UTF-8");
    }
  };

  switch (contentType) {
    case "":
    case undefined: {
      return undefined;
    }
    case "application/json": {
      const text = getText();
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new KnownErrors.BodyParsingError("Invalid JSON in request body");
      }
    }
    case "application/octet-stream": {
      return bodyBuffer;
    }
    case "text/plain": {
      return getText();
    }
    case "application/x-www-form-urlencoded": {
      const text = getText();
      try {
        return Object.fromEntries(new URLSearchParams(text).entries());
      } catch (e) {
        throw new KnownErrors.BodyParsingError("Invalid form data in request body");
      }
    }
    default: {
      throw new KnownErrors.BodyParsingError("Unknown content type in request body: " + contentType);
    }
  }
}

async function parseAuth(req: NextRequest): Promise<SmartRequestAuth | null> {
  const projectId = req.headers.get("x-stack-project-id");
  let requestType = req.headers.get("x-stack-access-type");
  const publishableClientKey = req.headers.get("x-stack-publishable-client-key");
  const secretServerKey = req.headers.get("x-stack-secret-server-key");
  const superSecretAdminKey = req.headers.get("x-stack-super-secret-admin");
  const adminAccessToken = req.headers.get("x-stack-admin-access-token");
  const authorization = req.headers.get("authorization");

  const eitherKeyOrToken = !!(publishableClientKey || secretServerKey || superSecretAdminKey || adminAccessToken);

  if (!requestType && eitherKeyOrToken) {
    // TODO in the future, when all clients have updated, throw KnownErrors.ProjectKeyWithoutRequestType instead of guessing
    if (adminAccessToken || superSecretAdminKey) {
      requestType = "admin";
    } else if (secretServerKey) {
      requestType = "server";
    } else if (publishableClientKey) {
      requestType = "client";
    }
  }
  if (!requestType) return null;
  if (!typedIncludes(["client", "server", "admin"] as const, requestType)) throw new KnownErrors.InvalidRequestType(requestType);
  if (!projectId) throw new KnownErrors.RequestTypeWithoutProjectId(requestType);

  let projectAccessType: "key" | "internal-user-token";
  if (adminAccessToken) {
    const reason = await whyNotProjectAdmin(projectId, adminAccessToken);
    switch (reason) {
      case null: {
        projectAccessType = "internal-user-token";
        break;
      }
      case "unparsable-access-token": {
        throw new KnownErrors.UnparsableAdminAccessToken();
      }
      case "not-admin": {
        throw new KnownErrors.AdminAccessTokenIsNotAdmin();
      }
      case "wrong-project-id": {
        throw new KnownErrors.InvalidProjectForAdminAccessToken();
      }
      case "access-token-expired": {
        throw new KnownErrors.AdminAccessTokenExpired();
      }
      default: {
        throw new StackAssertionError(`Unexpected reason for lack of project admin: ${reason}`);
      }
    }
  } else {
    switch (requestType) {
      case "client": {
        if (!publishableClientKey) throw new KnownErrors.ClientAuthenticationRequired();
        const isValid = await checkApiKeySet(projectId, { publishableClientKey });
        if (!isValid) throw new KnownErrors.InvalidPublishableClientKey(projectId);
        projectAccessType = "key";
        break;
      }
      case "server": {
        if (!secretServerKey) throw new KnownErrors.ServerAuthenticationRequired();
        const isValid = await checkApiKeySet(projectId, { secretServerKey });
        if (!isValid) throw new KnownErrors.InvalidSecretServerKey(projectId);
        projectAccessType = "key";
        break;
      }
      case "admin": {
        if (!superSecretAdminKey) throw new KnownErrors.AdminAuthenticationRequired();
        const isValid = await checkApiKeySet(projectId, { superSecretAdminKey });
        if (!isValid) throw new KnownErrors.InvalidSuperSecretAdminKey(projectId);
        projectAccessType = "key";
        break;
      }
    }
  }

  let project = await updateProject(
    projectId,
    {},
  );
  if (!project) {
    throw new KnownErrors.ProjectNotFound();
  }

  let user = null;
  if (authorization) {
    const decodedAccessToken = await decodeAccessToken(authorization.split(" ")[1]);
    const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

    if (accessTokenProjectId !== projectId) {
      throw new KnownErrors.InvalidProjectForAccessToken();
    }

    user = await updateServerUser(
      projectId,
      userId,
      {},
    );
  }

  return {
    project,
    user: user ?? undefined,
    projectAccessType,
    type: requestType,
  };
}

export async function createLazyRequestParser<T extends DeepPartialSmartRequestWithSentinel>(req: NextRequest, bodyBuffer: ArrayBuffer, schema: yup.Schema<T>, options?: { params: Record<string, string> }): Promise<() => Promise<[T, SmartRequest]>> {
  const urlObject = new URL(req.url);  
  const toValidate: SmartRequest = {
    url: req.url,
    method: typedIncludes(allowedMethods, req.method) ? req.method : throwErr(new StatusError(405, "Method not allowed")),
    body: await parseBody(req, bodyBuffer),
    headers: Object.fromEntries(
      [...groupBy(req.headers.entries(), ([key, _]) => key.toLowerCase())]
        .map(([key, values]) => [key, values.map(([_, value]) => value)]),
    ),
    query: Object.fromEntries(urlObject.searchParams.entries()),
    params: options?.params ?? {},
    auth: await parseAuth(req),
  };

  return async () => [await validate(toValidate, schema, req), toValidate];
}

export async function deprecatedParseRequest<T extends DeepPartial<Omit<SmartRequest, "headers" | "auth"> & { headers: Record<string, string> }>>(req: NextRequest, schema: yup.Schema<T>, options?: { params: Record<string, string> }): Promise<T> {
  const urlObject = new URL(req.url);
  const toValidate: Omit<SmartRequest, "headers"> & { headers: Record<string, string> } = {
    url: req.url,
    method: typedIncludes(allowedMethods, req.method) ? req.method : throwErr(new StatusError(405, "Method not allowed")),
    body: await parseBody(req, await req.arrayBuffer()),
    headers: Object.fromEntries([...req.headers.entries()].map(([k, v]) => [k.toLowerCase(), v])),
    query: Object.fromEntries(urlObject.searchParams.entries()),
    params: options?.params ?? {},
    auth: null,
  };

  return await validate(toValidate, schema, req);
}
