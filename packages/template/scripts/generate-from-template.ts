import fs from "fs";
import path from "path";

const allEnvs = ["next", "react-like", "js", "template"];

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

function removeEmptyFolders(dir: string) {
  if (!fs.existsSync(dir)) return;

  // Read directory contents efficiently
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  let isEmpty = true;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively remove empty subdirectories
      removeEmptyFolders(fullPath);

      // Check again after recursion if the folder is now empty
      if (fs.existsSync(fullPath) && fs.readdirSync(fullPath).length === 0) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        isEmpty = false;
      }
    } else {
      isEmpty = false; // Directory contains at least one file
    }
  }

  // Remove the root directory if it is empty
  if (isEmpty) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function generateFromTemplate(options: {
  src: string,
  dest: string,
  editFn?: (path: string, content: string) => string | null,
  topLevel?: boolean,
}) {
  prepareTargetDir(options.dest);

  // Read directory contents
  const entries = fs.readdirSync(options.src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(options.src, entry.name);
    const srcRelativePath = path.relative(currentDir, srcPath);
    let destPath = path.join(options.dest, entry.name);

    // Skip node_modules and dist directories
    if (ignoredFiles.includes(srcRelativePath)) {
      continue;
    }

    // Handle package.json and package-template.json
    if (!entry.isDirectory()) {
      if (entry.name === 'package.json') {
        continue; // Skip package.json
      } else if (entry.name === 'package-template.json') {
        destPath = path.join(options.dest, 'package.json'); // Rename to package.json
      }
    }

    if (entry.isDirectory()) {
      // Recursively copy directory
      generateFromTemplate({
        src: srcPath,
        dest: destPath,
        editFn: options.editFn,
        topLevel: false,
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

  if (options.topLevel === undefined || options.topLevel) {
    // Clean up empty folders after generation
    removeEmptyFolders(options.dest);
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

function processMacros(content: string, envs: string[]): string {
  const lines = content.split('\n');
  const result: string[] = [];

  // Each element in skipStack can be either:
  //
  // 1) A string like "NEXT_LINE", meaning skip exactly the next line.
  //
  // 2) An object of the form:
  //       { 
  //         type: 'IF_BLOCK',
  //         parentActive: boolean,
  //         hasMatched: boolean,
  //         isActive: boolean
  //       }
  //
  //    - parentActive = whether the block's parent is active. If false, this block can never produce output.
  //    - hasMatched   = if any branch in this block has matched so far (BEGIN_PLATFORM or ELSE_IF).
  //    - isActive     = if the *current branch* in this block is active right now.
  //
  interface IFBlockState {
    type: 'IF_BLOCK';
    parentActive: boolean;
    hasMatched: boolean;
    isActive: boolean;
  }

  const skipStack: Array<string | IFBlockState> = [];

  /**
   * Returns the top IF_BLOCK on the stack or null if none.
   */
  function getCurrentIFBlock(): IFBlockState | null {
    for (let i = skipStack.length - 1; i >= 0; i--) {
      const top = skipStack[i];
      if (typeof top !== 'string' && top.type === 'IF_BLOCK') {
        return top;
      }
    }
    return null;
  }

  /**
   * Check if we should output the current line (based on skipStack).
   */
  function shouldOutputLine(): boolean {
    // If there's a "NEXT_LINE" on top, we skip this line.
    // (We'll remove that NEXT_LINE after we handle this line.)
    for (let i = skipStack.length - 1; i >= 0; i--) {
      if (skipStack[i] === 'NEXT_LINE') {
        return false;
      }
    }

    // If any IF_BLOCK up the stack is not active, or its parent is not active, we skip.
    for (let i = skipStack.length - 1; i >= 0; i--) {
      const top = skipStack[i];
      if (typeof top !== 'string' && top.type === 'IF_BLOCK') {
        if (!top.parentActive || !top.isActive) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Consume a single-use "NEXT_LINE" skip once we've decided about output.
   */
  function consumeNextLineIfPresent() {
    const top = skipStack[skipStack.length - 1];
    if (top === 'NEXT_LINE') {
      skipStack.pop();
    }
  }

  /**
   * Parse environment tokens from a directive substring (the part after BEGIN_PLATFORM, ELSE_IF_PLATFORM, etc.).
   * We do a basic split on whitespace, then remove punctuation except for letters/numbers/hyphens.
   */
  function parseEnvList(envString: string): string[] {
    return envString
      .split(/\s+/)
      .map((e) => e.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean);
  }

  /**
   * We define flexible regexes that look for these directives *anywhere* in the line:
   *   - BEGIN_PLATFORM
   *   - ELSE_IF_PLATFORM
   *   - ELSE_PLATFORM
   *   - END_PLATFORM
   *   - NEXT_LINE_ONLY
   *
   * And then capture everything after that keyword up to the end of the line.
   *
   * Examples:
   *   "blah blah BEGIN_PLATFORM env1 env2 ???"  => captures "env1 env2 ???"
   *   "adsfasdf ELSE_PLATFORM blabla"         => captures "blabla"
   */
  const reBeginOnly = /\bBEGIN_PLATFORM\s+(.+)/i;
  const reElseIf    = /\bELSE_IF_PLATFORM\s+(.+)/i;
  const reElse      = /\bELSE_PLATFORM\b/i;
  const reEndOnly   = /\bEND_PLATFORM\b/i;
  const reNextLine  = /\bNEXT_LINE_ONLY\s+(.+)/i;

  for (const line of lines) {
    // 1) Try detecting BEGIN_PLATFORM ...
    const beginMatch = line.match(reBeginOnly);
    if (beginMatch) {
      const parentBlock = getCurrentIFBlock();
      // If parentActive = false or isActive = false => entire sub-block is inactive
      const parentIsFullyActive =
        !parentBlock ? true : (parentBlock.parentActive && parentBlock.isActive);

      if (!parentIsFullyActive) {
        // Just push an inactive block so we handle nested macros correctly
        skipStack.push({
          type: 'IF_BLOCK',
          parentActive: false,
          hasMatched: false,
          isActive: false
        });
      } else {
        const envList = parseEnvList(beginMatch[1]); // e.g. "env1 env2 ???"
        const matched = envList.some((e) => envs.includes(e));
        skipStack.push({
          type: 'IF_BLOCK',
          parentActive: true,
          hasMatched: matched, 
          isActive: matched
        });
      }
      // Skip output of the directive line
      continue;
    }

    // 2) Try detecting ELSE_IF_PLATFORM ...
    const elseIfMatch = line.match(reElseIf);
    if (elseIfMatch) {
      const block = getCurrentIFBlock();
      if (block) {
        if (!block.parentActive) {
          // Parent block is inactive => do nothing
        } else {
          // If block.hasMatched is true, we've already used an if/else if
          // If not, we check if the environment matches
          if (block.hasMatched) {
            block.isActive = false;
          } else {
            const envList = parseEnvList(elseIfMatch[1]);
            const matched = envList.some((e) => envs.includes(e));
            if (matched) {
              block.hasMatched = true;
              block.isActive = true;
            } else {
              block.isActive = false;
            }
          }
        }
      }
      // Skip output
      continue;
    }

    // 3) Try detecting ELSE_PLATFORM ...
    const elseMatch = line.match(reElse);
    if (elseMatch) {
      const block = getCurrentIFBlock();
      if (block) {
        if (!block.parentActive) {
          // Still nothing
        } else {
          // If we haven't matched anything yet, now we become active
          if (!block.hasMatched) {
            block.hasMatched = true;
            block.isActive = true;
          } else {
            // Already matched something, so skip
            block.isActive = false;
          }
        }
      }
      // Skip line
      continue;
    }

    // 4) Try detecting END_PLATFORM ...
    const endMatch = line.match(reEndOnly);
    if (endMatch) {
      // Pop the top IF_BLOCK
      const top = skipStack[skipStack.length - 1];
      if (typeof top !== 'string' && top.type === 'IF_BLOCK') {
        skipStack.pop();
      }
      // Skip line
      continue;
    }

    // 5) Try detecting NEXT_LINE_ONLY ...
    const nextLineMatch = line.match(reNextLine);
    if (nextLineMatch) {
      const envList = parseEnvList(nextLineMatch[1]);
      const matched = envList.some((e) => envs.includes(e));
      if (!matched) {
        skipStack.push('NEXT_LINE');
      }
      // Skip line
      continue;
    }

    // If it's a normal line:
    if (shouldOutputLine()) {
      result.push(line);
    }

    // If the top of the stack is NEXT_LINE, consume it once
    consumeNextLineIfPresent();
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
      "postcss.config.js",
      "tailwind.config.js",
      "quetzal.config.json",
      "components.json",
      ".env",
      ".env.local",
      "scripts/",
      "quetzal-translations/",
      "src/components/",
      "src/components-page/",
      "src/generated/",
      "src/providers/",
      "src/global.css",
      "src/global.d.ts",
    ];

    if (ignores.some(ignorePath => path.startsWith(ignorePath)) || path.endsWith('.tsx')) {
      return null;
    }

    content = processMacros(content, ["js"]);

    return content;
  },
});

generateFromTemplate({
  src: currentDir,
  dest: path.resolve(currentDir, "..", "stack"),
  editFn: (path, content) => {
    // ignore the generated folder as the files are big and not needed
    if (path.startsWith('src/generated')) {
      return content;
    }

    content = processMacros(content, ["next", "react-like"]);

    return content;
  },
});
