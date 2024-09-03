import { SnapshotSerializer } from "vitest";
import { typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import { nicify } from "@stackframe/stack-shared/dist/utils/strings";

const hideHeaders = [
  "access-control-allow-headers",
  "access-control-allow-methods",
  "access-control-allow-origin",
  "access-control-expose-headers",
  "cache-control",
  "connection",
  "content-security-policy",
  "content-type",
  "cross-origin-opener-policy",
  "date",
  "keep-alive",
  "permissions-policy",
  "referrer-policy",
  "transfer-encoding",
  "vary",
  "x-content-type-options",
  "x-frame-options",
  "content-encoding",
  "etag",
  "x-stack-request-id",
] as const;

const stripHeaders = [] as const;

const stripFields = [
  "access_token",
  "refresh_token",
  "date",
  "last_active_at_millis",
  "signed_up_at_millis",
  "expires_at_millis",
  "created_at_millis",
  "manually_revoked_at_millis",
  "publishable_client_key",
  "secret_server_key",
  "super_secret_admin_key",
  "attempt_code",
] as const;

const keyedCookieNamePrefixes = ["stack-oauth-inner-"] as const;

const stripUrlQueryParams = ["redirect_uri", "state", "code", "code_challenge"] as const;

function addAll<T>(set: Set<T>, values: readonly T[]) {
  for (const value of values) {
    set.add(value);
  }
}

const snapshotSerializer: SnapshotSerializer = {
  serialize(val, config, indentation, depth, refs) {
    return nicify(val, {
      currentIndent: indentation,
      maxDepth: config.maxDepth - depth,
      refs: new Map(refs.map((ref, i) => [ref, `vitestRef[${i}]`])),
      lineIndent: config.indent,
      multiline: true,
      path: "snapshot",
      overrides: (value, options) => {
        const parentValue = options?.parent?.value;

        // Strip all UUIDs except all-zero UUID
        if (typeof value === "string") {
          const newValue = value.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}/gi, "<stripped UUID>");
          if (newValue !== value) return nicify(newValue, options);
        }

        // Strip URL query params
        if (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
          const url = new URL(value);
          for (const param of stripUrlQueryParams) {
            if (url.searchParams.has(param)) {
              url.searchParams.set(param, "<stripped-query-param>");
            }
          }
          let newValue = url.toString();
          if (value.endsWith("/") !== newValue.endsWith("/")) {
            if (value.endsWith("/")) {
              newValue += "/";
            } else {
              newValue = newValue.slice(0, -1);
            }
          }
          if (newValue !== value) return nicify(newValue, options);
        }

        // Strip headers
        if (options?.parent?.value instanceof Headers) {
          if (typeof value !== "string") {
            throw new StackAssertionError("Headers should only contain string values");
          }
          const headerName = options.keyInParent?.toString().toLowerCase();
          if (typedIncludes(stripHeaders, headerName)) {
            return `<stripped header '${headerName}'>`;
          }
          if (headerName === "set-cookie") {
            const partsStrings = value.split(";").map((part) => part.trim());
            let cookieName = partsStrings[0].split("=")[0];
            if (keyedCookieNamePrefixes.some((prefix) => cookieName.startsWith(prefix))) {
              cookieName = `${keyedCookieNamePrefixes}<stripped cookie name key>`;
            }
            const cookieValue = partsStrings[0].split("=")[1];
            const parts = new Map(
              partsStrings.map((part) => {
                const [key, value] = part.split("=");
                return [key, value];
              }),
            );
            const expiresDate = new Date(parts.get("Expires") ?? "2002-01-01");
            if (expiresDate.getTime() < new Date("2001-01-01").getTime()) {
              return `<deleting cookie '${cookieName}' at path '${parts.get("Path") ?? "/"}'>`;
            } else {
              return `<setting cookie ${JSON.stringify(cookieName)} at path ${JSON.stringify(parts.get("Path") ?? "/")} to ${JSON.stringify(cookieValue)}>`;
            }
          }
        }

        // Hide fields
        const oldHideFields = options?.hideFields ?? [];
        const newHideFields = new Set<PropertyKey>(oldHideFields);
        if ((typeof value === "object" || typeof value === "function") && value && "getSnapshotSerializerOptions" in value) {
          const snapshotSerializerOptions = (value.getSnapshotSerializerOptions as any)();
          addAll(newHideFields, snapshotSerializerOptions?.hideFields ?? []);
        }
        if (value instanceof Headers) {
          addAll(newHideFields, hideHeaders);
        }
        if (newHideFields.size !== oldHideFields.length) {
          return nicify(value, {
            ...options,
            hideFields: [...newHideFields],
          });
        }

        // Strip fields
        if (
          (typeof parentValue === "object" || typeof parentValue === "function") &&
          parentValue &&
          options.keyInParent &&
          "getSnapshotSerializerOptions" in parentValue
        ) {
          const parentSnapshotSerializerOptions = (parentValue.getSnapshotSerializerOptions as any)();
          if (parentSnapshotSerializerOptions?.stripFields?.includes(options.keyInParent)) {
            return `<stripped field '${options.keyInParent.toString()}'>`;
          }
        }
        if (typedIncludes(stripFields, options?.keyInParent)) {
          return `<stripped field '${options.keyInParent}'>`;
        }

        // Otherwise, use default serialization
        return null;
      },
    });
  },
  test() {
    return true;
  },
};
export default snapshotSerializer;
