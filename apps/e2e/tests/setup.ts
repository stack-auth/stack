import { expect } from "vitest";


expect.extend({
  toSatisfy(received: string, predicate: (value: string) => boolean) {
    return {
      pass: predicate(received),
      message: () => `${received} does not satisfy predicate`,
    };
  },
});
