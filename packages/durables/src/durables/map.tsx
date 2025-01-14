export type AsyncMap<K, V> = {
  clear: () => Promise<void>,
  delete: (key: K) => Promise<boolean>,
  get: (key: K) => Promise<V | undefined>,
  has: (key: K) => Promise<boolean>,
  set: (key: K, value: V) => Promise<void>,
  entries: () => Promise<IterableIterator<[K, V]>>,
  keys: () => Promise<IterableIterator<K>>,
  values: () => Promise<IterableIterator<V>>,
  [Symbol.asyncIterator]: () => AsyncIterableIterator<[K, V]>,
};

/*
export class DurableMap<K, V> implements AsyncMap<K, V> {
  private readonly table:

  constructor(private readonly id: string) {
    // nothing to do here
  }

  async clear() {
    await sql`DELETE FROM ${this.id}`;
  }
}

*/
