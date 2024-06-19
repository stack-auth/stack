import { SnapshotSerializer } from "vitest";
import { Nicifiable, nicify } from "@stackframe/stack-shared/dist/utils/strings";
import { typedIncludes } from "@stackframe/stack-shared/dist/utils/arrays";

const stackSnapshotSerializerSymbol = Symbol("stackSnapshotSerializer");

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
        const stackSnapshotSerializer: null | {
          headersHidden?: true,
        } = (value as any)[stackSnapshotSerializerSymbol];

        // Hide headers
        if (value instanceof Headers && !stackSnapshotSerializer?.headersHidden) {
          const originalHeaders = [...value.entries()];
          const filteredHeaders = originalHeaders.filter(([key]) => !typedIncludes(hideHeaders, key.toLowerCase()));
          return ["replace", Object.assign(new Headers(filteredHeaders), {
            [stackSnapshotSerializerSymbol]: {
              headersHidden: true,
            },
            getNicifiedObjectExtraLines: () => [`<some headers may have been hidden>`],
          })];
        }

        // Strip headers
        if (options?.parent?.value instanceof Headers) {
          const headerName = options.keyInParent?.toString().toLowerCase();
          if (typedIncludes(stripHeaders, headerName)) {
            return ["result", `<stripped header '${headerName}'>`];
          }
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
