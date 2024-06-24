import { SnapshotSerializer } from "vitest";
import { Nicifiable, nicify } from "@stackframe/stack-shared/dist/utils/strings";
import { typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";

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
];

const stripHeaders = ["x-stack-request-id"];

const stripFields = ["access_token", "refresh_token", "id", "date"];

function addAll<T>(set: Set<T>, values: T[]) {
  for (const value of values) {
    set.add(value);
  }
}

const snapshotSerializer: SnapshotSerializer = {
  serialize(val, config, indentation, depth, refs, printer) {
    return nicify(val, {
      currentIndent: indentation,
      maxDepth: config.maxDepth - depth,
      refs: new Map(refs.map((ref, i) => [ref, `vitestRef[${i}]`])),
      lineIndent: config.indent,
      multiline: true,
      path: "snapshot",
      overrides: (value, options) => {
        const parentValue = options?.parent?.value;

        // Strip headers
        if (options?.parent?.value instanceof Headers) {
          const headerName = options.keyInParent?.toString().toLowerCase();
          if (typedIncludes(stripHeaders, headerName)) {
            return `<stripped header '${headerName}'>`;
          }
        }

        // Hide fields
        const oldHideFields = options?.hideFields ?? [];
        let newHideFields = new Set<PropertyKey>(oldHideFields);
        if (
          (typeof value === "object" || typeof value === "function")
          && value
          && "getSnapshotSerializerOptions" in value
        ) {
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
          (typeof parentValue === "object" || typeof parentValue === "function")
          && parentValue
          && options.keyInParent
          && "getSnapshotSerializerOptions" in parentValue
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
  test(val) {
    return true;
  },
};
export default snapshotSerializer;
