import { createDurablesError } from "../errors";
import { Sql, SqlIdentifier, query, sql, toSqlPartSymbol } from "../sql";
import { generateHashedCode } from "../util/hashes";
import { Durable, DurableId, DurableIdInput, assertDurableId, durableIdSymbol, flattenId } from "./durable";


export class DurableTable implements Durable {
  private readonly _id: DurableId;
  private readonly _createTablePromise: Promise<{ tableName: SqlIdentifier }>;

  constructor(options: {
    id: DurableIdInput,
    createTable: (tableName: SqlIdentifier) => Sql,
  }) {
    assertDurableId(options.id);
    this._id = options.id;
    const flattenedId = flattenId(this._id);

    this._createTablePromise = (async () => {
      const dbTableNameHash = await generateHashedCode("DurableTable-table-name", JSON.stringify(flattenedId));
      const sqlIdentifier = sql.identifier(`_durables_${dbTableNameHash}`);
      const createSql = options.createTable(sqlIdentifier).map(async (parts) => {
        if (!['CREATE TABLE IF NOT EXISTS', '/* DURABLES-IGNORE-PREFIX-WARNING */'].some(prefix => parts.rawStrings[0].trim().toUpperCase().startsWith(prefix))) {
          throw createDurablesError`
            SQL returned from createTable must start with CREATE TABLE IF NOT EXISTS.

            In case this is intended, add the prefix '/* DURABLES-IGNORE-PREFIX-WARNING */' (without quotes) instead.

            Received: ${parts.rawStrings[0]}
          `();
        }
        return parts;
      });
      await query(createSql);
      return { tableName: sqlIdentifier };
    })();
  }

  get [durableIdSymbol]() {
    return this._id;
  }

  async [toSqlPartSymbol]() {
    const { tableName } = await this._createTablePromise;
    return tableName;
  }
}
