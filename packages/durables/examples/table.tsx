// Ensure the following environment variable is set:
//   DURABLES_CONNECTION_STRING=memory://

// NOTE: It is not usually advisable to use the DurableTable class directly. Instead, use one of the higher-level
// durable types, such as DurableMap or DurableBag, as they provide a more convenient API.

import { DurableTable, query, sql } from "@stackframe/durables";

async function main() {
  const table = new DurableTable({
    id: "durables-table-example:v1",
    createTable: (tableName) => sql`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id BIGSERIAL PRIMARY KEY,
        value TEXT
      )
    `,
  });

  const emptyTableResult = await query`SELECT id, value FROM ${table}`;
  console.log("No rows:", emptyTableResult.rows);  // prints []
  // (if we use a persistent store instead of memory, it may have some data from previous runs)

  const value = `It's ${new Date().toISOString()}`;
  await query`INSERT INTO ${table} (value) VALUES (${value})`;

  const updatedTableResult = await query`SELECT id, value FROM ${table}`;
  console.log("Inserted row:", updatedTableResult.rows);  // prints [{ id: 'some-id', value: "It's <current time>" }]
}
main().catch(console.error);
