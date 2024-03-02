import { use } from "react";
import { neverResolve } from "stack-shared/dist/utils/promises";

export function suspend(): never {
  use(neverResolve());
  throw new Error("Somehow a Promise that never resolves was resolved?");
}
