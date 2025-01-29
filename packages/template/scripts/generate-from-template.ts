import fs from "fs";
import path from "path";

const currentDir = path.resolve(__dirname, "..");

function prepareTargetDir(dir: string) {
  if (fs.existsSync(dir)) {
    // Read directory contents
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Remove everything except node_modules and dist
    for (const entry of entries) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
      }
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateFromTemplate(options: {
  src: string,
  dest: string,
  editFn?: (path: string, content: string) => string | null,
}) {
  prepareTargetDir(options.dest);

  // Read directory contents
  const entries = fs.readdirSync(options.src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(options.src, entry.name);
    const destPath = path.join(options.dest, entry.name);

    // Skip node_modules and dist directories
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively copy directory
      generateFromTemplate({
        src: srcPath,
        dest: destPath,
        editFn: options.editFn,
      });
    } else {
      // Copy file
      const content = fs.readFileSync(srcPath, "utf-8");
      const editedContent = options.editFn?.(path.relative(currentDir, srcPath), content) ?? content;

      // Skip file if editFn returns null
      if (editedContent === null) {
        continue;
      }

      fs.writeFileSync(destPath, editedContent);
    }
  }
}

function transformPackageJson(content: string, transform: (json: any) => void) {
  let json = JSON.parse(content);
  json.name = "@stackframe/js";
  delete json.private;
  transform(json);
  return JSON.stringify(json, null, 2);
}

generateFromTemplate({
  src: currentDir,
  dest: path.resolve(currentDir, "..", "js"),
  editFn: (path, content) => {
    if (path === 'package.json') {
      return transformPackageJson(content, (json) => {
        delete json.peerDependencies;
        delete json.peerDependenciesMeta;
        delete json.devDependencies.react;
        delete json.devDependencies["react-dom"];
      });
    }
    return null;
  },
});
