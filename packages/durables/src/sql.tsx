import { Extensions, PGlite, PGliteOptions } from "@electric-sql/pglite";
import { repeat } from "@stackframe/stack-shared/dist/utils/arrays";
import { typedAssign } from "@stackframe/stack-shared/dist/utils/objects";
import { getDeindentInfo, indentExceptFirstLine, nicify } from "@stackframe/stack-shared/dist/utils/strings";
import { ensureTrailingSlash } from "@stackframe/stack-shared/dist/utils/urls";
import { fileURLToPath, pathToFileURL } from "url";
import { DurablesError, createDurablesError } from "./errors";
import { brandValue } from "./util/brands";

export const toSqlPartSymbol = Symbol.for('durables--toSqlPart');

let connectionString = typeof process !== 'undefined' ?
  process.env.DURABLES_CONNECTION_STRING
  || process.env.NEXT_PUBLIC_DURABLES_CONNECTION_STRING
  || undefined
  : undefined;

export function setConnectionString(newConnectionString: string) {
  connectionString = newConnectionString;
}

export function getConnectionString() {
  return connectionString;
}

let dbPromise: ReturnType<typeof createDb> | undefined;
async function getDb() {
  if (!dbPromise) {
    dbPromise = createDb();
  }
  return await dbPromise;
}

const pgliteOptions: PGliteOptions<Extensions> = {
  debug: 0,
};

async function createDb() {
  if (!connectionString) {
    throw createDurablesError`
      You haven't provided a connection string to Durables.

      Please set the DURABLES_CONNECTION_STRING environment variable (eg. to 'memory://') or use setConnectionString() to set a global one in code.
    `();
  }

  const baseUrl = typeof process !== 'undefined' ? pathToFileURL(process.cwd())
    : typeof window !== 'undefined' ? window.location.href
      : undefined;
  const connectionUrl = new URL(connectionString, baseUrl !== undefined ? ensureTrailingSlash(baseUrl) : undefined);

  switch (connectionUrl.protocol) {
    case 'memory:': {
      if (connectionString !== 'memory://') {
        throw createDurablesError`
          Invalid connection string: ${connectionString}.

          In-memory databases must use the connection string 'memory://'.
        `();
      }

      return new PGlite("memory://", pgliteOptions);
    }
    case 'file:': {
      const filePath = fileURLToPath(connectionUrl);
      return new PGlite(filePath, pgliteOptions);
    }
    default: {
      throw createDurablesError`
        Unsupported connection string: ${connectionString}.

        The protocol ${connectionUrl.protocol} is not supported; try a valid connection string (eg. 'memory://').
      `();
    }
  }
}

export class DurablesSqlError extends DurablesError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DurablesSqlError';
  }
}

function formatPostgresError(error: Error & { position?: number}, query: string, params: SqlValue[]) {
  const position = error.position;
  const beforePosition = query.slice(0, position);
  const beforeLines = beforePosition.split('\n');
  const line = beforeLines[beforeLines.length - 1];
  const markerLine = repeat(line.length - 1, () => ' ').join('') + '^';
  const markerLineIndex = beforeLines.length;

  const queryLines = query.split('\n');

  return createDurablesError`
    ${error.message}

    Query:
      ${queryLines.slice(0, markerLineIndex).join('\n')}
      ${markerLine}
      ${queryLines.slice(markerLineIndex).join('\n')}

    Params:
      ${nicify(params)}
  `({ cause: error, errorClass: DurablesSqlError });
}

export async function query(sql: Sql): Promise<any>;
export async function query(sql: TemplateStringsArray, ...args: Sqlizable[]): Promise<any>;
export async function query(q: Sql | TemplateStringsArray, ...args: Sqlizable[]): Promise<any> {
  if (Array.isArray(q)) {
    return await query(sql(q as TemplateStringsArray, ...args));
  } else if (q instanceof _SqlImpl) {
    const db = await getDb();
    const parts = await q.partsPromise;

    const query = [
      parts.rawStrings[0],
      ...parts.params.flatMap((_, index) => [`$${index + 1}`, parts.rawStrings[index + 1]]),
    ].join(' ');
    const params = [...parts.params];

    try {
      const result = await db.query(query, params);
      return result;
    } catch (error) {
      if (error instanceof Error && "code" in error && "file" in error && "position" in error) {
        // likely to be a node-postgres error
        throw formatPostgresError(error as any, query, params);
      }
    }
  } else {
    throw createDurablesError`
      Invalid SQL query: ${q}
    `();
  }
}

type Parts = {
  readonly rawStrings: readonly string[],
  readonly params: readonly SqlValue[],
};

class _SqlPartImpl {
  public readonly __sqlPartBrand = brandValue;
  public readonly partsPromise: Promise<Parts>;

  constructor(partsPromise: _SqlPartImpl['partsPromise']) {
    this.partsPromise = (async () => {
      const parts = await partsPromise;
      if (parts.rawStrings.length === 0) {
        throw createDurablesError`
          Raw strings must have at least one element
        `();
      }
      if (parts.rawStrings.length !== parts.params.length + 1) {
        throw createDurablesError`
          Raw strings must have one more element than params
        `();
      }
      return parts;
    })();
  }

  map(fn: (value: Parts) => Promise<Parts>): SqlPart {
    return new _SqlPartImpl(this.partsPromise.then(fn));
  }
}

class _SqlIdentifierImpl extends _SqlPartImpl {
  public __sqlIdentifierBrand = brandValue;

  constructor(...args: ConstructorParameters<typeof _SqlPartImpl>) {
    super(...args);
  }

  map(fn: (value: Parts) => Promise<Parts>): SqlIdentifier {
    return new _SqlIdentifierImpl(this.partsPromise.then(fn));
  }
}

class _SqlImpl extends _SqlPartImpl {
  public __sqlBrand = brandValue;

  constructor(...args: ConstructorParameters<typeof _SqlPartImpl>) {
    super(...args);
  }

  map(fn: (value: Parts) => Promise<Parts>): Sql {
    return new _SqlImpl(this.partsPromise.then(fn));
  }
}

export type SqlPart = _SqlPartImpl;
export type SqlIdentifier = _SqlIdentifierImpl;
export type Sql = _SqlImpl;
export type SqlValue = string | number | boolean | null | SqlValue[];
export type Sqlizable = SqlPart | SqlValue | { [toSqlPartSymbol]: () => Promise<Sqlizable> };

function sqlize(value: Sqlizable): SqlPart {
  if (value instanceof _SqlPartImpl) {
    return value;
  }
  if (typeof value === 'object' && value !== null && toSqlPartSymbol in value) {
    return sql.deferred(value[toSqlPartSymbol]().then(sqlize));
  }
  return sql.value(value);
}

function indentSql(value: SqlPart, indentation: string): SqlPart {
  return new _SqlPartImpl((async () => {
    const { rawStrings, params } = await value.partsPromise;
    return {
      rawStrings: rawStrings.map(raw => indentExceptFirstLine(raw, indentation)),
      params,
    };
  })());
}

export const sql = typedAssign(
  (strings: TemplateStringsArray, ...args: Sqlizable[]): Sql => {
    const [deindentedStrings, deindentInfo] = getDeindentInfo(strings, ...args);
    let result = sql.raw(deindentedStrings[0]);
    for (let i = 1; i < deindentedStrings.length; i++) {
      const info = deindentInfo[i-1];
      result = sql.concat(
        result,
        indentSql(sqlize(info.value), info.indentation),
        sql.raw(deindentedStrings[i]),
      );
    }
    return result;
  },
  {
    empty: () => sql``,
    raw: (raw: string): Sql => new _SqlImpl(Promise.resolve({
      rawStrings: [raw],
      params: [],
    })),
    identifier: (identifier: string): SqlIdentifier => {
      if (identifier.includes(String.fromCharCode(0))) {
        throw createDurablesError`
          Identifier cannot contain NUL characters
        `();
      }
      return new _SqlIdentifierImpl(Promise.resolve({
        rawStrings: [`"${identifier.replace(/"/g, '""')}"`],
        params: [],
      }));
    },
    isValue: (value: unknown): value is SqlValue => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null || Array.isArray(value),
    value: (value: SqlValue): SqlPart => {
      if (!sql.isValue(value)) {
        throw createDurablesError`
          Invalid SQL value: ${nicify(value)}
        `();
      }
      return new _SqlPartImpl(Promise.resolve({
        rawStrings: ['', ''],
        params: [value],
      }));
    },
    deferred: sqlDeferred,
    concat: (...parts: SqlPart[]): Sql => {
      if (parts.length === 2) {
        return new _SqlImpl((async () => {
          const first = await parts[0].partsPromise;
          const second = await parts[1].partsPromise;
          return {
            rawStrings: [
              ...first.rawStrings.slice(0, -1),
              first.rawStrings[first.rawStrings.length - 1] + second.rawStrings[0],
              ...second.rawStrings.slice(1)
            ],
            params: [
              ...first.params,
              ...second.params,
            ],
          };
        })());
      } else {
        let result = sql``;
        for (const part of parts) {
          result = sql.concat(result, part);
        }
        return result;
      }
    },
    join: (parts: SqlPart[], separator: SqlPart) => {
      if (parts.length === 0) {
        return sql``;
      }
      return sql.concat(parts[0], ...parts.flatMap(part => [separator, part]));
    }
  }
);

// we need to define this here because we can't specify function overloads in the object literal without casting
// (or at least I don't know how)
function sqlDeferred(promise: Promise<Sql>): Sql;
function sqlDeferred(promise: Promise<SqlPart>): SqlPart;
function sqlDeferred(promise: Promise<SqlPart>): SqlPart {
  return new _SqlImpl(promise.then(part => part.partsPromise));
}
