import { isTruthy } from "@stackframe/stack-shared/dist/utils/booleans";
import { StackAssertionError } from "@stackframe/stack-shared/dist/utils/errors";
import type { listRecursively as listRecursivelyFn } from "@stackframe/stack-shared/dist/utils/fs";
import { numberCompare } from "@stackframe/stack-shared/dist/utils/numbers";

const listRecursively: typeof listRecursivelyFn = async (...args) => {
  // SmartRouter may be imported on the edge, so we can't import fs at the top level
  // hence, this wrapper function
  const m = await import("@stackframe/stack-shared/dist/utils/fs");
  return await m.listRecursively(...args);
};

export const SmartRouter = {
  listRoutes: async () => {
    const routePaths = await listRecursively("src/app", { excludeDirectories: true });
    const res = [];
    for (const path of routePaths) {
      const isRoute = !!path.match(/route\.[^/]+$/);
      const isPage = !!path.match(/page\.[^/]+$/);
      if (!isRoute && !isPage) {
        continue;
      }
      const normalizedPath = normalizeAppPath(path.replace("src/app", ""));
      if (normalizedPath.includes("/_")) {
        continue;
      }

      res.push({
        filePath: path,
        normalizedPath,
        match: (path: string) => matchPath(path, normalizedPath),
        isRoute,
        isPage,
      });
    }
    return res;
  },

  listApiVersions: async () => {
    const apiVersions = await listRecursively("src/app/api", { excludeDirectories: true });
    return [
      ...new Set(
      apiVersions.map((path) => path.match(/src\/app\/api\/(v[^/]+)/)?.[1])
        .filter(isTruthy)
        .sort((a, b) => {
          const parsedA = parseApiVersionStringToArray(a!);
          const parsedB = parseApiVersionStringToArray(b!);
          return numberCompare(parsedA[0], parsedB[0]) * 2 + numberCompare(parsedA[1], parsedB[1]);
        })
      ),
      "latest",
    ];
  },

  matchNormalizedPath: (path: string, normalizedPath: string) => matchPath(path, normalizedPath),
};

function parseApiVersionStringToArray(version: string): [number, number] {
  const matchResult = version.match(/^v(\d+)(?:beta(\d+))?$/);
  if (!matchResult) throw new StackAssertionError(`Invalid API version string: ${version}`);
  return [+matchResult[1], matchResult[2] === "" ? Number.POSITIVE_INFINITY : +matchResult[2]];
}


function matchPath(path: string, toMatchWith: string): Record<string, string | string[]> | false {
  // get the relative part, and modify it to have a leading slash, without a trailing slash, without ./.., etc.
  const url = new URL(path + "/", "http://example.com");
  const modifiedPath = url.pathname.slice(1, -1);
  const modifiedToMatchWith = toMatchWith.slice(1);

  if (modifiedPath === "" && modifiedToMatchWith === "") {
    return {};
  }

  const pathFirst = modifiedPath.split("/")[0];
  const toMatchWithFirst = modifiedToMatchWith.split("/")[0];
  const recurse = () => matchPath(modifiedPath.slice((modifiedPath + "/").indexOf("/")), modifiedToMatchWith.slice((modifiedToMatchWith + "/").indexOf("/")));

  if (toMatchWithFirst.startsWith("[[...") && toMatchWithFirst.endsWith("]]")) {
    if (modifiedToMatchWith.includes("/")) {
      throw new StackAssertionError("Optional catch-all routes must be at the end of the path", { modifiedPath, modifiedToMatchWith });
    }
    return {
      [toMatchWithFirst.slice(5, -2)]: modifiedPath === "" ? [] : modifiedPath.split("/"),
    };
  } else if (toMatchWithFirst.startsWith("[...") && toMatchWithFirst.endsWith("]")) {
    if (modifiedToMatchWith.includes("/")) {
      throw new StackAssertionError("Catch-all routes must be at the end of the path", { modifiedPath, modifiedToMatchWith });
    }
    if (modifiedPath === "") return false;
    return {
      [toMatchWithFirst.slice(4, -1)]: modifiedPath.split("/"),
    };
  } else if (toMatchWithFirst.startsWith("[") && toMatchWithFirst.endsWith("]")) {
    if (modifiedPath === "") return false;
    const recurseResult = recurse();
    if (!recurseResult) return false;
    return {
      [toMatchWithFirst.slice(1, -1)]: pathFirst,
      ...recurseResult,
    };
  } else if (toMatchWithFirst === pathFirst) {
    return recurse();
  } else {
    return false;
  }
}

/**
 * Modified from: https://github.com/vercel/next.js/blob/6ff13369bb18045657d0f84ddc86b540340603a1/packages/next/src/shared/lib/router/utils/app-paths.ts#L23
 */
function normalizeAppPath(route: string) {
  let res = route.split('/').reduce((pathname, segment, index, segments) => {
    // Empty segments are ignored.
    if (!segment) {
      return pathname;
    }

    // Groups are ignored.
    if (segment.startsWith('(') && segment.endsWith(')')) {
      return pathname;
    }

    // Parallel segments are ignored.
    if (segment[0] === '@') {
      return pathname;
    }

    // The last segment (if it's a leaf) should be ignored.
    if (
      (segment.startsWith('page.') || segment.startsWith('route.')) &&
      index === segments.length - 1
    ) {
      return pathname;
    }

    return `${pathname}/${segment}`;
  }, '');

  if (!res.startsWith('/')) {
    res = `/${res}`;
  }
  return res;
}
