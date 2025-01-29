import * as fs from "node:fs";
import * as path from "node:path";

export async function list(path: string) {
  return await fs.promises.readdir(path);
}

export async function listRecursively(p: string, options: { excludeDirectories?: boolean } = {}): Promise<string[]> {
  const files = await list(p);
  return [
    ...(await Promise.all(files.map(async (fileName) => {
      const filePath = path.join(p, fileName);
      if ((await fs.promises.stat(filePath)).isDirectory()) {
        return [
          ...(await listRecursively(filePath, options)),
          ...(options.excludeDirectories ? [] : [filePath]),
        ];
      } else {
        return [filePath];
      }
    }))).flat(),
  ];
}
