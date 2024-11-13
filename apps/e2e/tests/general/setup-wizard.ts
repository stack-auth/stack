import { exec } from "child_process";
import { describe } from "vitest";
import { it } from "../helpers";

describe("Setup wizard", () => {
  it("completes successfully with create-next-app", async ({ expect }) => {
    const [error, stdout, stderr] = await new Promise<[Error | null, string, string]>((resolve) => {
      exec("pnpm -C packages/init-stack run test-run-auto", (error, stdout, stderr) => {
        resolve([error, stdout, stderr]);
      });
    });
    expect(error, `Expected no error to be thrown!\n\n\n\nstdout: ${stdout}\n\n\n\nstderr: ${stderr}`).toBeNull();
  }, 120_000);
});
