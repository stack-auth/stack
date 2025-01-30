import fs from "fs";
import path from "path";

const allEnvs = ["next", "react-like", "js"];

const currentDir = path.resolve(__dirname, "..");

const ignoredFiles = ['node_modules', 'dist', '.turbo', 'scripts/generate-from-template.ts', "package-template.json"];

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
      const editedContent = options.editFn?.(srcRelativePath, content);

      // Skip file if editFn returns null
      if (options.editFn && editedContent === null) {
        continue;
      }

      fs.writeFileSync(destPath, editedContent || content);
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
    const processDirective = (match: RegExpMatchArray | null, skipType: string) => {
      if (match) {
        const lineEnvs = match[1].split(/\s+/).map(e => e.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''));
        if (!lineEnvs.some(e => envs.includes(e))) {
          skipUntil.push(skipType);
        }
        return true;
      }
      return false;
    };

    // Check for BEGIN_ONLY and NEXT_LINE_ONLY
    if (processDirective(line.match(/.*BEGIN_ONLY\s+(.+)$/), 'END_ONLY')) continue;
    if (processDirective(line.match(/.*NEXT_LINE_ONLY\s+(.+)$/), 'NEXT_LINE')) continue;

    // Check for END_ONLY
    if (line.includes('END_ONLY')) {
      if (skipUntil[skipUntil.length - 1] === 'END_ONLY') {
        skipUntil.pop();
      }
      continue;
    }

    // Skip lines if we're inside a skipped block
    if (skipUntil.length > 0) {
      if (skipUntil[skipUntil.length - 1] === 'NEXT_LINE') {
        skipUntil.pop();
      }
      continue;
    }

    // Don't include BEGIN_ONLY/END_ONLY/NEXT_LINE_ONLY lines in output
    if (!line.includes('BEGIN_ONLY') && !line.includes('END_ONLY') && !line.includes('NEXT_LINE_ONLY')) {
      result.push(line);
    }
  }

  return result.join('\n');
}

// Copy package-template.json to package.json and apply macros
const packageTemplateContent = fs.readFileSync(path.join(currentDir, 'package-template.json'), 'utf-8');
const processedPackageJson = processMacros(packageTemplateContent, allEnvs);
fs.writeFileSync(path.join(currentDir, 'package.json'), processedPackageJson);


generateFromTemplate({
  src: currentDir,
  dest: path.resolve(currentDir, "..", "js"),
  editFn: (path, content) => {
    const ignores = [
      "scripts/",
      "quetzal-translations",
      "src/components/",
      "src/components-page/",
      "src/generated/",
      "src/providers/",
      "src/translations.tsx",
      "postcss.config.js",
      "tailwind.config.js",
      "quetzal.config.json",
      "components.json",
    ];

    if (ignores.some(ignorePath => path.startsWith(ignorePath))) {
      return null;
    }

    content = processMacros(content, ["js"]);

    if (path === 'package.json') {
      return transformPackageJson({
        name: "@stackframe/js",
        content,
      });
    }

    return content;
  },
});

generateFromTemplate({
  src: currentDir,
  dest: path.resolve(currentDir, "..", "stack"),
  editFn: (path, content) => {
    // ignore the generated folder as the files are big and not needed
    if (path.includes('/generated')) {
      return content;
    }

    content = processMacros(content, ["next", "react-like"]);

    if (path === 'package.json') {
      return transformPackageJson({
        name: "@stackframe/stack",
        content,
      });
    }

    return content;
  },
});
