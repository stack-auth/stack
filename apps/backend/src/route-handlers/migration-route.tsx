import { typedFromEntries } from "@stackframe/stack-shared/dist/utils/objects";
import { HTTP_METHODS } from "next/dist/server/web/http";
import { NextRequest, NextResponse } from "next/server";

type Endpoints = {
  [key: string]: {
    [key in (typeof HTTP_METHODS)[number]]?: (req: NextRequest) => Promise<NextResponse>
  },
};

function urlMatch(url: string, nextPattern: string): Record<string, any> | null {
  const keys: string[] = [];

  const regexPattern = nextPattern
    // match (name)
    .replace(/\/\(.*?\)/g, '')
    // match [...]
    .replace(/\[\.\.\.\]/g, '.*')
    // match [...name]
    .replace(/\[\.\.\.\w+\]/g, (match) => {
      const key = match.slice(1, -1);
      keys.push(key);
      return '(.*?)';
    })
    // match [name]
    .replace(/\[\w+\]/g, (match) => {
      const key = match.slice(1, -1);
      keys.push(key);
      return '([^/]+)';
    });

  const regex = new RegExp(`^${regexPattern}$`);
  const match = regex.exec(url);

  if (!match) return null;

  const result: Record<string, any> = {};
  keys.forEach((key, index) => {
    const value = match[index + 1];
    if (key.startsWith('...')) {
      result[key.slice(3)] = value.split('/');
    } else {
      result[key] = value;
    }
  });

  return result;
}

export function createMigrationRoute(newEndpoints: Endpoints) {
  return typedFromEntries(HTTP_METHODS.map((method) => {
    return [method, (req: NextRequest) => {
      for (const [url, endpointMethods] of Object.entries(newEndpoints)) {
        const match = urlMatch(new URL(req.url).pathname.replace('v2', 'v1'), url);
        if (!match) {
          return new NextResponse(null, { status: 404 });
        } else {
          if (endpointMethods[method]) {
            return NextResponse.json({ match, url: req.url, nextUrl: url });
          } else {
            return new NextResponse(null, { status: 405 });
          }
        }
      }
    }];
  }));
}

