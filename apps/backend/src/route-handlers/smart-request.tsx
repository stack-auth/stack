import "../polyfills";

import { NextRequest } from "next/server";
import { StackAssertionError, StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";
import { deepPlainClone } from "@stackframe/stack-shared/dist/utils/objects";
import { groupBy, typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { KnownErrors } from "@stackframe/stack-shared";
import { checkApiKeySet } from "@/lib/api-keys";
import { getProject, whyNotProjectAdmin } from "@/lib/projects";
import { decodeAccessToken } from "@/lib/tokens";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";
import { ReplaceFieldWithOwnUserId, StackAdaptSentinel } from "@stackframe/stack-shared/dist/schema-fields";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { usersCrudHandlers } from "@/app/api/v1/users/crud";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { CrudHandlerInvocationError } from "./crud-handler";

const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

export type SmartRequestAuth = {
  project: ProjectsCrud["Admin"]["Read"],
  user?: UsersCrud["Admin"]["Read"] | undefined,
  type: "client" | "server" | "admin",
};

export type DeepPartialSmartRequestWithSentinel<T = SmartRequest> = (T extends object ? {
  [P in keyof T]?: DeepPartialSmartRequestWithSentinel<T[P]>
} : T) | StackAdaptSentinel;

export type SmartRequest = {
  auth: SmartRequestAuth | null,
  url: string,
  method: typeof allowedMethods[number],
  body: unknown,
  headers: Record<string, string[] | undefined>,
  query: Record<string, string | undefined>,
  params: Record<string, string | undefined>,
};

export type MergeSmartRequest<T, MSQ = SmartRequest> =
  StackAdaptSentinel extends T ? NonNullable<MSQ> | (MSQ & Exclude<T, StackAdaptSentinel>) : (
    T extends object ? (MSQ extends object ? { [K in keyof T & keyof MSQ]: MergeSmartRequest<T[K], MSQ[K]> } : (T & MSQ))
    : (T & MSQ)
  );

async function validate<T>(obj: SmartRequest, schema: yup.Schema<T>, req: NextRequest | null): Promise<T> {
  try {
    return await schema.validate(obj, {
      abortEarly: false,
      context: {
        noUnknownPathPrefixes: ["body", "query", "params"],
      },
    });
  } catch (error) {
    if (error instanceof ReplaceFieldWithOwnUserId) {
      // parse yup path
      let pathRemaining = error.path;
      const fieldPath = [];
      while (pathRemaining.length > 0) {
        if (pathRemaining.startsWith("[")) {
          const index = pathRemaining.indexOf("]");
          if (index < 0) throw new StackAssertionError("Invalid path");
          fieldPath.push(JSON.parse(pathRemaining.slice(1, index)));
          pathRemaining = pathRemaining.slice(index + 1);
        } else {
          let dotIndex = pathRemaining.indexOf(".");
          if (dotIndex === -1) dotIndex = pathRemaining.length;
          fieldPath.push(pathRemaining.slice(0, dotIndex));
          pathRemaining = pathRemaining.slice(dotIndex + 1);
        }
      }

      const newObj = deepPlainClone(obj);
      let it = newObj;
      for (const field of fieldPath.slice(0, -1)) {
        if (!Object.prototype.hasOwnProperty.call(it, field)) {
          throw new StackAssertionError(`Segment ${field} of path ${error.path} not found in object`);
        }
        it = (it as any)[field];
      }
      (it as any)[fieldPath[fieldPath.length - 1]] = obj.auth?.user?.id ?? throwErr(new KnownErrors.CannotGetOwnUserWithoutUser());

      return await validate(newObj, schema, req);
    } else if (error instanceof yup.ValidationError) {
      if (req === null) {
        // we weren't called by a HTTP request, so it must be a logical error in a manual invocation
        throw new StackAssertionError("Request validation failed", {}, { cause: error });
      } else {
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
    }
    throw error;
  }
}


async function parseBody(req: NextRequest, bodyBuffer: ArrayBuffer): Promise<SmartRequest["body"]> {
  const contentType = req.headers.get("content-type")?.split(";")[0];

  const getText = () => {
    try {
      return new TextDecoder().decode(bodyBuffer);
    } catch {
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
      } catch {
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
      } catch {
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
  const requestType = req.headers.get("x-stack-access-type");
  const publishableClientKey = req.headers.get("x-stack-publishable-client-key");
  const secretServerKey = req.headers.get("x-stack-secret-server-key");
  const superSecretAdminKey = req.headers.get("x-stack-super-secret-admin-key");
  const adminAccessToken = req.headers.get("x-stack-admin-access-token");
  const accessToken = req.headers.get("x-stack-access-token");

  const eitherKeyOrToken = !!(publishableClientKey || secretServerKey || superSecretAdminKey || adminAccessToken);

  if (!requestType && eitherKeyOrToken) {
    throw new KnownErrors.ProjectKeyWithoutAccessType();
  }
  if (!requestType) return null;
  if (!typedIncludes(["client", "server", "admin"] as const, requestType)) throw new KnownErrors.InvalidAccessType(requestType);
  if (!projectId) throw new KnownErrors.AccessTypeWithoutProjectId(requestType);

  if (adminAccessToken) {
    const reason = await whyNotProjectAdmin(projectId, adminAccessToken);
    switch (reason) {
      case null: {
        break;
      }
      case "unparsable-access-token": {
        throw new KnownErrors.UnparsableAdminAccessToken();
      }
      case "not-admin": {
        throw new KnownErrors.AdminAccessTokenIsNotAdmin();
      }
      case "wrong-token-project-id": {
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
        break;
      }
      case "server": {
        if (!secretServerKey) throw new KnownErrors.ServerAuthenticationRequired();
        const isValid = await checkApiKeySet(projectId, { secretServerKey });
        if (!isValid) throw new KnownErrors.InvalidSecretServerKey(projectId);
        break;
      }
      case "admin": {
        if (!superSecretAdminKey) throw new KnownErrors.AdminAuthenticationRequired();
        const isValid = await checkApiKeySet(projectId, { superSecretAdminKey });
        if (!isValid) throw new KnownErrors.InvalidSuperSecretAdminKey(projectId);

        break;
      }
      default: {
        throw new StackAssertionError(`Unexpected request type: ${requestType}. This should never happen because we should've filtered this earlier`);
      }
    }
  }

  const project = await getProject(projectId);
  if (!project) {
    throw new StackAssertionError("Project not found; this should never happen because passing the checks until here should guarantee that the project exists and that access to it is granted", { projectId });
  }

  let user = null;
  if (accessToken) {
    const decodedAccessToken = await decodeAccessToken(accessToken);
    const { userId, projectId: accessTokenProjectId } = decodedAccessToken;

    if (accessTokenProjectId !== projectId) {
      throw new KnownErrors.InvalidProjectForAccessToken();
    }

    try {
      user = await usersCrudHandlers.adminRead({
        project,
        user_id: userId,
      });
    } catch (e) {
      if (e instanceof CrudHandlerInvocationError && e.cause instanceof KnownErrors.UserNotFound) {
        user = null;
      }
    }
  }

  return {
    project,
    user: user ?? undefined,
    type: requestType,
  };
}

export async function createSmartRequest(req: NextRequest, bodyBuffer: ArrayBuffer, options?: { params: Record<string, string> }): Promise<SmartRequest> {
  const urlObject = new URL(req.url);
  return {
    url: req.url,
    method: typedIncludes(allowedMethods, req.method) ? req.method : throwErr(new StatusError(405, "Method not allowed")),
    body: await parseBody(req, bodyBuffer),
    headers: Object.fromEntries(
      [...groupBy(req.headers.entries(), ([key]) => key.toLowerCase())]
        .map(([key, values]) => [key, values.map(([, value]) => value)]),
    ),
    query: Object.fromEntries(urlObject.searchParams.entries()),
    params: options?.params ?? {},
    auth: await parseAuth(req),
  } satisfies SmartRequest;
}

export async function validateSmartRequest<T extends DeepPartialSmartRequestWithSentinel>(nextReq: NextRequest | null, smartReq: SmartRequest, schema: yup.Schema<T>): Promise<T> {
  return await validate(smartReq, schema, nextReq);
}
