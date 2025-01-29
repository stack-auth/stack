import fs from "fs";
import path from "path";

const currentDir = path.resolve(__dirname, "..");

const ignoredFiles = ['node_modules', 'dist', '.turbo', 'scripts/generate-from-template.ts'];

function prepareTargetDir(dir: string) {
  if (fs.existsSync(dir)) {
    // Read directory contents
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Remove everything except node_modules and dist
    for (const entry of entries) {
      if (!ignoredFiles.includes(entry.name)) {
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
    const srcRelativePath = path.relative(currentDir, srcPath);
    const destPath = path.join(options.dest, entry.name);

    // Skip node_modules and dist directories
    if (ignoredFiles.includes(srcRelativePath)) {
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
      const editedContent = options.editFn?.(srcRelativePath, content) ?? content;

      // Skip file if editFn returns null
      if (editedContent === null) {
        continue;
      }

      fs.writeFileSync(destPath, editedContent);
    }
  }
}

function transformPackageJson(
  options: {
    name: string,
    transform?: (json: any) => void,
    content: string,
  },
) {
  let json = JSON.parse(options.content);
  json.name = options.name;
  delete json.private;
  options.transform?.(json);
  return JSON.stringify(json, null, 2);
}

function processMacros(content: string, envs: string[]) {
  const lines = content.split('\n');
  const result: string[] = [];
  let skipUntil: string[] = [];

  for (const line of lines) {
    // Check for BEGIN_ONLY
    const beginMatch = line.match(/.*BEGIN_ONLY\s+(.+)$/);
    if (beginMatch) {
      const envs = beginMatch[1].split(/\s+/);
      if (!envs.map(e => e.trim().toLowerCase()).some(e => envs.includes(e.toLowerCase()))) {
        skipUntil.push('END_ONLY');
      }
      continue;
    }

    // Check for END_ONLY
    if (line.trim() === 'END_ONLY') {
      if (skipUntil[skipUntil.length - 1] === 'END_ONLY') {
        skipUntil.pop();
      }
      continue;
    }

    // Skip lines if we're inside a skipped block
    if (skipUntil.length > 0) {
      continue;
    }

    // Don't include BEGIN_ONLY/END_ONLY lines in output
    if (!line.includes('BEGIN_ONLY') && !line.includes('END_ONLY')) {
      result.push(line);
    }
  }

  return result.join('\n');
}

generateFromTemplate({
  src: currentDir,
  dest: path.resolve(currentDir, "..", "js"),
  editFn: (path, content) => {
    if (path.startsWith("scripts/")) {
      return null;
    }

    content = processMacros(content, ["JS"]);

    if (path === 'package.json') {
      return transformPackageJson({
        name: "@stackframe/js",
        content,
        transform: (json) => {
          delete json.peerDependencies;
          delete json.peerDependenciesMeta;
          delete json.devDependencies.react;
          delete json.devDependencies["react-dom"];
        },
      });
    }

    return content;
  },
});

generateFromTemplate({
  src: currentDir,
  dest: path.resolve(currentDir, "..", "stack"),
  editFn: (path, content) => {
    content = processMacros(content, ["NEXT", "REACT-LIKE"]);

    if (path === 'package.json') {
      return transformPackageJson({
        name: "@stackframe/stack",
        content,
      });
    }

    return content;
  },
});
