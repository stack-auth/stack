import { expect, it } from "vitest";
import { templateIdentity } from "./strings";

it("should be equivalent to using a regular template string", () => {
  const adjective = "scientific";
  expect(templateIdentity`a certain ${adjective} railgun`).toBe(`a certain ${adjective} railgun`);
});
