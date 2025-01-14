import { query } from "../sql";
import { Durable, DurableId, DurableIdInput, assertDurableId, durableIdSymbol, getMainTableRowInfo } from "./durable";


export class DurableVariable<T> implements Durable {
  private readonly _id: DurableId;

  constructor(id: undefined extends T ? DurableIdInput : never);
  constructor(options: {
    id: DurableIdInput,
    defaultValue: T,
  });
  constructor(options: DurableIdInput | {
    id: DurableIdInput,
    defaultValue: T,
  }) {
    if (typeof options !== 'object' || !("id" in options)) {
      options = {
        id: options,
        defaultValue: undefined as T,
      };
    }

    assertDurableId(options.id);
    this._id = options.id;
  }

  async get() {
    const { tableName, rowCondition } = await getMainTableRowInfo(this._id);
    const result = await query`
      SELECT value
      FROM ${tableName} 
      WHERE ${rowCondition}
    `;
    return result.rows[0]?.value as T;
  }

  async set(value: T) {
    const { tableName, rowAllParentIds, rowId } = await getMainTableRowInfo(this._id);
    await query`
      INSERT INTO ${tableName} (all_parent_ids, id, value)
      VALUES (${rowAllParentIds}, ${rowId}, ${JSON.stringify(value)}::jsonb)
      ON CONFLICT (all_parent_ids, id) DO UPDATE SET value = ${JSON.stringify(value)}::jsonb
    `;
  }

  get [durableIdSymbol]() {
    return this._id;
  }
}
