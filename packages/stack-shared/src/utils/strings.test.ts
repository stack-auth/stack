import { describe, expect, it } from "vitest";
import { templateIdentity } from "./strings";

describe("templateIdentity", () => {
  it("should be equivalent to a regular template string", () => {
    const adjective = "scientific";
    const noun = "railgun";
    expect(templateIdentity`a certain scientific railgun`).toBe("a certain scientific railgun");
    expect(templateIdentity`a certain ${adjective} railgun`).toBe(`a certain scientific railgun`);
    expect(templateIdentity`a certain ${adjective} ${noun}`).toBe(`a certain scientific railgun`);
    expect(templateIdentity`${adjective}${noun}`).toBe(`scientificrailgun`);
  });

  it("should work with empty strings", () => {
    expect(templateIdentity``).toBe("");
    expect(templateIdentity`${""}`).toBe("");
    expect(templateIdentity`${""}${""}`).toBe("");
  });

  it("should work with normal arrays", () => {
    expect(templateIdentity(
      ["a ", " scientific ", "gun"],
      "certain", "rail")
    ).toBe("a certain scientific railgun");
    expect(templateIdentity(["a"])).toBe("a");
  });

  it("should throw an error with wrong number of value arguments", () => {
    expect(() => templateIdentity([])).toThrow();
    expect(() => templateIdentity(["a", "b"])).toThrow();
    expect(() => templateIdentity(["a", "b", "c"], "a", "b", "c")).toThrow();
  });
});
