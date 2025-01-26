
import { createDurablesError } from "../errors";
import { SqlIdentifier, SqlPart, query, sql } from "../sql";

type DurableStringId = `${Lowercase<string>}:v${number}`;
export type DurableIdInput = DurableStringId | [Durable, DurableStringId];
export type DurableId = DurableIdInput & {
  __brand: 'DurableId',
};

export const durableIdSymbol = Symbol.for('durables--durableId');

export type Durable = {
  [durableIdSymbol]: DurableId,
};

export function assertDurableId(id: DurableIdInput): asserts id is DurableId {
  if (typeof id !== 'string') {
    throw createDurablesError`
      Invalid ID: ${id}. Must be a string
    `();
  }
  if (id.length === 0) {
    throw createDurablesError`
      Invalid empty ID. Must be a non-empty string
    `();
  }

  const splitByColon = id.split(':');
  if (splitByColon.length !== 2) {
    throw createDurablesError`
      Invalid ID: ${id}. Must follow the format: <name>:v<version>
    `();
  }

  const name = splitByColon[0];
  const version = splitByColon[1];

  if (!name.match(/^[a-z0-9-]+$/)) {
    throw createDurablesError`
      Invalid ID: ${id}. Name must be lowercase alphanumeric with dashes
    `();
  }

  if (!version.match(/^v([1-9][0-9]*|0)$/)) {
    throw createDurablesError`
      Invalid ID: ${id}. Version must be a positive integer
    `();
  }
}

export function flattenId(id: DurableId): { allParentIds: string[], id: string } {
  if (typeof id === 'string') {
    return { allParentIds: [], id };
  } else {
    const flattenedParent = flattenId(id[0][durableIdSymbol]);
    return {
      allParentIds: [...flattenedParent.allParentIds, flattenedParent.id],
      id: id[1],
    };
  }
}


// Even though we don't have to do this as the operations below are idempotent, we save ourselves a few queries
let _hasCreatedDurablesTable = false;
let _createdDurableIdsInDurablesTable: Set<string> = new Set();

export async function getMainTableRowInfo(id: DurableId): Promise<{ tableName: SqlIdentifier, rowCondition: SqlPart, rowAllParentIds: string[], rowId: string }> {
  const { allParentIds, id: durableId } = flattenId(id);

  if (!_hasCreatedDurablesTable) {
    await query`
      CREATE TABLE IF NOT EXISTS _durables (
        db_internal_id BIGSERIAL PRIMARY KEY,
        db_internal_parent_id BIGINT,
        id TEXT NOT NULL,
        all_parent_ids TEXT[] NOT NULL,
        value JSONB,
        CONSTRAINT _durables_parent_id_fkey FOREIGN KEY (db_internal_parent_id) REFERENCES _durables(db_internal_id) ON DELETE CASCADE,
        CONSTRAINT _durables_all_parent_ids_id_unique UNIQUE (all_parent_ids, id)
      )
    `;
    await query`
      CREATE INDEX IF NOT EXISTS _durables_id_idx ON _durables (db_internal_id)
    `;
    await query`
      CREATE INDEX IF NOT EXISTS _durables_parent_id_idx ON _durables (db_internal_parent_id)
    `;
    await query`
      CREATE INDEX IF NOT EXISTS _durables_all_parent_ids_idx ON _durables USING GIN (all_parent_ids)
    `;
    await query`
      CREATE INDEX IF NOT EXISTS _durables_all_parent_ids_id_idx ON _durables (all_parent_ids, id)
    `;
    _hasCreatedDurablesTable = true;
  }

  if (!_createdDurableIdsInDurablesTable.has(durableId)) {
    await query`
      INSERT INTO _durables (
        id,
        all_parent_ids,
        db_internal_parent_id
      )
      VALUES (
        ${durableId},
        ${allParentIds},
        ${allParentIds.length === 0 ? null : sql`
          (SELECT db_internal_id FROM _durables WHERE all_parent_ids = ${allParentIds.slice(0, -1)} AND id = ${allParentIds[allParentIds.length - 1]})
        `}
      )
      ON CONFLICT (all_parent_ids, id) DO NOTHING;
    `;
    _createdDurableIdsInDurablesTable.add(durableId);
  }

  return {
    tableName: sql.identifier('_durables'),
    rowCondition: sql`all_parent_ids = ${allParentIds} AND id = ${durableId}`,
    rowAllParentIds: allParentIds,
    rowId: durableId,
  };
}
