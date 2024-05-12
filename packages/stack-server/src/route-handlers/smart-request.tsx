import "../polyfills";

import { NextRequest } from "next/server";
import { StackAssertionError, StatusError, throwErr } from "@stackframe/stack-shared/dist/utils/errors";
import * as yup from "yup";
import { DeepPartial } from "@stackframe/stack-shared/dist/utils/objects";
import { groupBy, typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { KnownError, KnownErrors, ProjectJson, ServerUserJson, UserJson } from "@stackframe/stack-shared";
import { IsAny } from "@stackframe/stack-shared/dist/utils/types";
import { checkApiKeySet } from "@/lib/api-keys";
import { isProjectAdmin, updateProject, whyNotProjectAdmin } from "@/lib/projects";
import { updateServerUser } from "@/lib/users";
import { decodeAccessToken } from "@/lib/tokens";

const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

export type SmartRequestAuth = {
  project: ProjectJson,
  user: ServerUserJson | null,
  projectAccessType: "key" | "internal-user-token",
  type: "client" | "server" | "admin",
  allowClient: boolean,
  allowServer: boolean,
  allowAdmin: boolean,
} /*& (
  | {
    type: "client",
    allowClient: true,
    allowServer: false,
    allowAdmin: false,
  }
  | {
    type: "server",
    allowClient: true,
    allowServer: true,
    allowAdmin: false,
  }
  | {
    type: "admin",
    allowClient: true,
    allowServer: true,
    allowAdmin: true,
  }
)*/;

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
  IsAny<T> extends true ? MSQ : (
    T extends object ? (MSQ extends object ? { [K in keyof T]: K extends keyof MSQ ? MergeSmartRequest<T[K], MSQ[K]> : undefined } : MSQ)
    : T
  );

async function validate<T>(obj: unknown, schema: yup.Schema<T>): Promise<T> {
  try {
    return await schema.validate(obj, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new StatusError(400, error.errors.join("\n\n"));
    }
    throw error;
  }
}


async function parseBody(req: NextRequest): Promise<SmartRequest["body"]> {
  const contentType = req.headers.get("content-type")?.split(";")[0];
  switch (contentType) {
    case "":
    case undefined: {
      return undefined;
    }
    case "application/json": {
      try {
        return await req.json();
      } catch (e) {
        throw new StatusError(400, "Invalid JSON in request body");
      }
    }
    case "application/octet-stream": {
      return await req.arrayBuffer();
    }
    case "text/plain": {
      try {
        return await req.text();
      } catch (e) {
        throw new StatusError(400, "Invalid text in request body");
      }
    }
    case "application/x-www-form-urlencoded": {
      try {
        return Object.fromEntries(new URLSearchParams(await req.text()).entries());
      } catch (e) {
        throw new StatusError(400, "Invalid form data in request body");
      }
    }
    default: {
      throw new StatusError(400, "Unknown content type in request body: " + contentType);
    }
  }
}

async function parseAuth(req: NextRequest): Promise<SmartRequestAuth | null> {
  const projectId = req.headers.get("x-stack-project-id");
  const requestType = req.headers.get("x-stack-request-type");
  const publishableClientKey = req.headers.get("x-stack-publishable-client-key");
  const secretServerKey = req.headers.get("x-stack-secret-server-key");
  const superSecretAdminKey = req.headers.get("x-stack-super-secret-admin");
  const adminAccessToken = req.headers.get("x-stack-admin-access-token");
  const authorization = req.headers.get("authorization");

  const eitherKeyOrToken = !!(publishableClientKey || secretServerKey || superSecretAdminKey || adminAccessToken);

  if (!requestType && eitherKeyOrToken) throw new KnownErrors.ProjectKeyWithoutRequestType();
  if (!requestType) return null;
  if (!typedIncludes(["client", "server", "admin"] as const, requestType)) throw new KnownErrors.InvalidRequestType(requestType);
  if (!projectId) throw new KnownErrors.RequestTypeWithoutProjectId(requestType);

  let projectAccessType: "key" | "internal-user-token";
  switch (requestType) {
    case "client": {
      if (!publishableClientKey) throw new KnownErrors.ClientAuthenticationRequired();
      const isValid = await checkApiKeySet(projectId, { publishableClientKey });
      if (!isValid) throw new KnownErrors.InvalidPublishableClientKey();
      projectAccessType = "key";
      break;
    }
    case "server": {
      if (!secretServerKey) throw new KnownErrors.ServerAuthenticationRequired();
      const isValid = await checkApiKeySet(projectId, { secretServerKey });
      if (!isValid) throw new KnownErrors.InvalidSecretServerKey();
      projectAccessType = "key";
      break;
    }
    case "admin": {
      if (superSecretAdminKey) {
        const isValid = await checkApiKeySet(projectId, { secretServerKey: superSecretAdminKey });
        if (!isValid) throw new KnownErrors.InvalidSuperSecretAdminKey();
        projectAccessType = "key";
      } else if (adminAccessToken) {
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
        throw new KnownErrors.AdminAuthenticationRequired();
      }
      break;
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
    user,
    projectAccessType,
    type: requestType,
    allowClient: true,
    allowServer: requestType === "server" || requestType === "admin",
    allowAdmin: requestType === "admin",
  };
}

export async function parseRequest<T extends DeepPartial<SmartRequest>>(req: NextRequest, schema: yup.Schema<T>, options?: { params: Record<string, string> }): Promise<T> {
  const urlObject = new URL(req.url);  
  const toValidate: SmartRequest = {
    url: req.url,
    method: typedIncludes(allowedMethods, req.method) ? req.method : throwErr(new StatusError(405, "Method not allowed")),
    body: await parseBody(req),
    headers: Object.fromEntries(
      [...groupBy(req.headers.entries(), ([key, _]) => key.toLowerCase())]
        .map(([key, values]) => [key, values.map(([_, value]) => value)]),
    ),
    query: Object.fromEntries(urlObject.searchParams.entries()),
    params: options?.params ?? {},
    auth: await parseAuth(req),
  };

  return await validate(toValidate, schema);
}

export async function deprecatedParseRequest<T extends DeepPartial<Omit<SmartRequest, "headers" | "auth"> & { headers: Record<string, string> }>>(req: NextRequest, schema: yup.Schema<T>, options?: { params: Record<string, string> }): Promise<T> {
  const urlObject = new URL(req.url);
  const toValidate: Omit<SmartRequest, "headers"> & { headers: Record<string, string> } = {
    url: req.url,
    method: typedIncludes(allowedMethods, req.method) ? req.method : throwErr(new StatusError(405, "Method not allowed")),
    body: await parseBody(req),
    headers: Object.fromEntries([...req.headers.entries()].map(([k, v]) => [k.toLowerCase(), v])),
    query: Object.fromEntries(urlObject.searchParams.entries()),
    params: options?.params ?? {},
    auth: null,
  };

  return await validate(toValidate, schema);
}
