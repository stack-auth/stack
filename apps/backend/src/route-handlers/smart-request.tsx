import "../polyfills";

import { getUser } from "@/app/api/v1/users/crud";
import { checkApiKeySet } from "@/lib/api-keys";
import { getProject, listManagedProjectIds } from "@/lib/projects";
import { decodeAccessToken } from "@/lib/tokens";
import { KnownErrors } from "@stackframe/stack-shared";
import { ProjectsCrud } from "@stackframe/stack-shared/dist/interface/crud/projects";
import { UsersCrud } from "@stackframe/stack-shared/dist/interface/crud/users";
import { ReplaceFieldWithOwnUserId, StackAdaptSentinel, yupValidate } from "@stackframe/stack-shared/dist/schema-fields";
import { groupBy, typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { StackAssertionError, StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import { deepPlainClone } from "@stackframe/stack-shared/dist/utils/objects";
import { ignoreUnhandledRejection } from "@stackframe/stack-shared/dist/utils/promises";
import { deindent } from "@stackframe/stack-shared/dist/utils/strings";
import { NextRequest } from "next/server";
import * as yup from "yup";

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
  clientVersion: {
    platform: string,
    sdk: string,
    version: string,
  } | undefined,
};

export type MergeSmartRequest<T, MSQ = SmartRequest> =
  StackAdaptSentinel extends T ? NonNullable<MSQ> | (MSQ & Exclude<T, StackAdaptSentinel>) : (
    T extends object ? (MSQ extends object ? { [K in keyof T & keyof MSQ]: MergeSmartRequest<T[K], MSQ[K]> } : (T & MSQ))
    : (T & MSQ)
  );

async function validate<T>(obj: SmartRequest, schema: yup.Schema<T>, req: NextRequest | null): Promise<T> {
  try {
    return await yupValidate(schema, obj, {
      abortEarly: false,
      context: {
        noUnknownPathPrefixes: ["body", "query", "params"],
      },
      currentUserId: obj.auth?.user?.id ?? null,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
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
  const superSecretAdminKey = req.headers.get("x-stack-super-secret-admin-key");
  const adminAccessToken = req.headers.get("x-stack-admin-access-token");
  const accessToken = req.headers.get("x-stack-access-token");
  const refreshToken = req.headers.get("x-stack-refresh-token");

  const extractUserFromAccessToken = async (options: { token: string, projectId: string }) => {
    const result = await decodeAccessToken(options.token);
    if (result.status === "error") {
      throw result.error;
    }

    if (result.data.projectId !== options.projectId) {
      throw new KnownErrors.InvalidProjectForAccessToken();
    }

    const user = await getUser({ projectId: options.projectId, userId: result.data.userId });
    if (!user) {
      // this is the case when access token is still valid, but the user is deleted from the database
      throw new KnownErrors.AccessTokenExpired();
    }

    return user;
  };

  const extractUserFromAdminAccessToken = async (options: { token: string, projectId: string }) => {
    const result = await decodeAccessToken(options.token);
    if (result.status === "error") {
      if (result.error instanceof KnownErrors.AccessTokenExpired) {
        throw new KnownErrors.AdminAccessTokenExpired();
      } else {
        throw new KnownErrors.UnparsableAdminAccessToken();
      }
    }

    if (result.data.projectId !== "internal") {
      throw new KnownErrors.AdminAccessTokenIsNotAdmin();
    }

    const user = await getUser({ projectId: 'internal', userId: result.data.userId });
    if (!user) {
      // this is the case when access token is still valid, but the user is deleted from the database
      throw new KnownErrors.AdminAccessTokenExpired();
    }

    const allProjects = listManagedProjectIds(user);
    if (!allProjects.includes(options.projectId)) {
      throw new KnownErrors.AdminAccessTokenIsNotAdmin();
    }

    return user;
  };

  // Do all the requests in parallel
  const queries = {
    project: projectId ? ignoreUnhandledRejection(getProject(projectId)) : Promise.resolve(null),
    isClientKeyValid: projectId && publishableClientKey ? ignoreUnhandledRejection(checkApiKeySet(projectId, { publishableClientKey })) : Promise.resolve(false),
    isServerKeyValid: projectId && secretServerKey ? ignoreUnhandledRejection(checkApiKeySet(projectId, { secretServerKey })) : Promise.resolve(false),
    isAdminKeyValid: projectId && superSecretAdminKey ? ignoreUnhandledRejection(checkApiKeySet(projectId, { superSecretAdminKey })) : Promise.resolve(false),
    user: projectId && accessToken ? ignoreUnhandledRejection(extractUserFromAccessToken({ token: accessToken, projectId })) : Promise.resolve(null),
    internalUser: projectId && adminAccessToken ? ignoreUnhandledRejection(extractUserFromAdminAccessToken({ token: adminAccessToken, projectId })) : Promise.resolve(null),
  } as const;

  const eitherKeyOrToken = !!(publishableClientKey || secretServerKey || superSecretAdminKey || adminAccessToken);

  if (!requestType && eitherKeyOrToken) {
    throw new KnownErrors.ProjectKeyWithoutAccessType();
  }
  if (!requestType) return null;
  if (!typedIncludes(["client", "server", "admin"] as const, requestType)) throw new KnownErrors.InvalidAccessType(requestType);
  if (!projectId) throw new KnownErrors.AccessTypeWithoutProjectId(requestType);

  if (adminAccessToken) {
    if (await queries.internalUser) {
      if (!await queries.project) {
        // this happens if the project is still in the user's managedProjectIds, but has since been deleted
        throw new KnownErrors.InvalidProjectForAdminAccessToken();
      }
    } else {
      // This case should be prevented by checks inside extractUserFromAdminAccessToken, if this happens, something is wrong
      throw new StackAssertionError("adminAccessToken exists but no internal user was found");
    }
  } else {
    switch (requestType) {
      case "client": {
        if (!publishableClientKey) throw new KnownErrors.ClientAuthenticationRequired();
        if (!await queries.isClientKeyValid) throw new KnownErrors.InvalidPublishableClientKey(projectId);
        break;
      }
      case "server": {
        if (!secretServerKey) throw new KnownErrors.ServerAuthenticationRequired();
        if (!await queries.isServerKeyValid) throw new KnownErrors.InvalidSecretServerKey(projectId);
        break;
      }
      case "admin": {
        if (!superSecretAdminKey) throw new KnownErrors.AdminAuthenticationRequired();
        if (!await queries.isAdminKeyValid) throw new KnownErrors.InvalidSuperSecretAdminKey(projectId);
        break;
      }
      default: {
        throw new StackAssertionError(`Unexpected request type: ${requestType}. This should never happen because we should've filtered this earlier`);
      }
    }
  }

  const project = await queries.project;
  if (!project) {
    throw new StackAssertionError("Project not found; this should never happen because passing the checks until here should guarantee that the project exists and that access to it is granted", { projectId });
  }

  return {
    project,
    user: await queries.user ?? undefined,
    type: requestType,
  };
}

export async function createSmartRequest(req: NextRequest, bodyBuffer: ArrayBuffer, options?: { params: Record<string, string> }): Promise<SmartRequest> {
  const urlObject = new URL(req.url);
  const clientVersionMatch = req.headers.get("x-stack-client-version")?.match(/^(\w+)\s+(@[\w\/]+)@([\d.]+)$/);

  return {
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
    clientVersion: clientVersionMatch ? {
      platform: clientVersionMatch[1],
      sdk: clientVersionMatch[2],
      version: clientVersionMatch[3],
    } : undefined,
  } satisfies SmartRequest;
}

export async function validateSmartRequest<T extends DeepPartialSmartRequestWithSentinel>(nextReq: NextRequest | null, smartReq: SmartRequest, schema: yup.Schema<T>): Promise<T> {
  return await validate(smartReq, schema, nextReq);
}
