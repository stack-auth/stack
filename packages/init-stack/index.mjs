#!/usr/bin/env node

import inquirer from "inquirer";
import * as fs from "fs";
import * as child_process from "child_process";
import * as path from "path";
import open from "open";

const jsLikeFileExtensions = [
  "mtsx",
  "ctsx",
  "tsx",
  "mts",
  "cts",
  "ts",
  "mjsx",
  "cjsx",
  "jsx",
  "mjs",
  "cjs",
  "js",
];

class UserError extends Error {
  constructor(message) {
    super(message);
    this.name = "UserError";
  }
}

let savedProjectPath = process.argv[2] || undefined;

const isDryRun = process.argv.includes("--dry-run");

const ansis = {
  red: "\x1b[31m",
  blue: "\x1b[34m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  clear: "\x1b[0m",
  bold: "\x1b[1m",
};

const filesCreated = [];
const filesModified = [];
const commandsExecuted = [];

async function main() {
  console.log();
  console.log(`
       ██████
   ██████████████
████████████████████
████████████████████                WELCOME TO
█████████████████        ╔═╗╔╦╗╔═╗╔═╗╦╔═  ┌─┐┬ ┬┌┬┐┬ ┬
█████████████            ╚═╗ ║ ╠═╣║  ╠╩╗  ├─┤│ │ │ ├─┤
█████████████   ████     ╚═╝ ╩ ╩ ╩╚═╝╩ ╩  ┴ ┴└─┘ ┴ ┴ ┴
   █████████████████
       ██████     ██
████            ████
   █████    █████
       ██████
  `);
  console.log();

  let projectPath = await getProjectPath();
  if (!fs.existsSync(projectPath)) {
    throw new UserError(`The project path ${projectPath} does not exist`);
  }

  const packageJsonPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new UserError(
      `The package.json file does not exist in the project path ${projectPath}. You must initialize a new project first before installing Stack.`
    );
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const nextVersionInPackageJson = packageJson?.dependencies?.["next"] ?? packageJson?.devDependencies?.["next"];
  if (!nextVersionInPackageJson) {
    throw new UserError(
      `The project at ${projectPath} does not appear to be a Next.js project, or does not have 'next' installed as a dependency. Only Next.js projects are currently supported.`
    );
  }
  if (
    !nextVersionInPackageJson.includes("14") &&
    !nextVersionInPackageJson.includes("15") &&
    nextVersionInPackageJson !== "latest"
  ) {
    throw new UserError(
      `The project at ${projectPath} is using an unsupported version of Next.js (found ${nextVersionInPackageJson}).\n\nOnly Next.js 14 & 15 projects are currently supported. See Next's upgrade guide: https://nextjs.org/docs/app/building-your-application/upgrading/version-14`
    );
  }

  const nextConfigPathWithoutExtension = path.join(projectPath, "next.config");
  const nextConfigFileExtension = await findJsExtension(
    nextConfigPathWithoutExtension
  );
  const nextConfigPath =
    nextConfigPathWithoutExtension + "." + (nextConfigFileExtension ?? "js");
  if (!fs.existsSync(nextConfigPath)) {
    throw new UserError(
      `Expected file at ${nextConfigPath}. Only Next.js projects are currently supported.`
    );
  }

  const envPath = path.join(projectPath, ".env");
  const envDevelopmentPath = path.join(projectPath, ".env.development");
  const envDefaultPath = path.join(projectPath, ".env.default");
  const envDefaultsPath = path.join(projectPath, ".env.defaults");
  const envExamplePath = path.join(projectPath, ".env.example");
  const envLocalPath = path.join(projectPath, ".env.local");
  const potentialEnvLocations = [
    envPath,
    envDevelopmentPath,
    envDefaultPath,
    envDefaultsPath,
    envExamplePath,
    envLocalPath,
  ];

  const hasSrcAppFolder = fs.existsSync(path.join(projectPath, "src/app"));
  const srcPath = path.join(projectPath, hasSrcAppFolder ? "src" : "");
  const appPath = path.join(srcPath, "app");
  if (!fs.existsSync(appPath)) {
    throw new UserError(
      `The app path ${appPath} does not exist. Only the Next.js app router is supported.`
    );
  }

  const layoutPathWithoutExtension = path.join(appPath, "layout");
  const layoutFileExtension =
    (await findJsExtension(layoutPathWithoutExtension)) ?? "jsx";
  const layoutPath = layoutPathWithoutExtension + "." + layoutFileExtension;
  const layoutContent =
    (await readFile(layoutPath)) ??
    throwErr(
      `The layout file at ${layoutPath} does not exist. Stack requires a layout file to be present in the /app folder.`
    );
  const updatedLayoutResult =
    (await getUpdatedLayout(layoutContent)) ??
    throwErr(
      "Unable to parse root layout file. Make sure it contains a <body> tag. If it still doesn't work, you may need to manually install Stack. See: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required"
    );
  const updatedLayoutContent = updatedLayoutResult.content;

  const defaultExtension = layoutFileExtension;
  const ind = updatedLayoutResult.indentation;

  const stackAppPathWithoutExtension = path.join(srcPath, "stack");
  const stackAppFileExtension =
    (await findJsExtension(stackAppPathWithoutExtension)) ?? defaultExtension;
  const stackAppPath =
    stackAppPathWithoutExtension + "." + stackAppFileExtension;
  const stackAppContent = await readFile(stackAppPath);
  if (stackAppContent) {
    if (!stackAppContent.includes("@stackframe/stack")) {
      throw new UserError(
        `A file at the path ${stackAppPath} already exists. Stack uses the /src/stack.ts file to initialize the Stack SDK. Please remove the existing file and try again.`
      );
    }
    throw new UserError(
      `It seems that you already installed Stack in this project.`
    );
  }

  const handlerPathWithoutExtension = path.join(
    appPath,
    "handler/[...stack]/page"
  );
  const handlerFileExtension =
    (await findJsExtension(handlerPathWithoutExtension)) ?? defaultExtension;
  const handlerPath = handlerPathWithoutExtension + "." + handlerFileExtension;
  const handlerContent = await readFile(handlerPath);
  if (handlerContent && !handlerContent.includes("@stackframe/stack")) {
    throw new UserError(
      `A file at the path ${handlerPath} already exists. Stack uses the /handler path to handle incoming requests. Please remove the existing file and try again.`
    );
  }

  let loadingPathWithoutExtension = path.join(appPath, "loading");
  const loadingFileExtension =
    (await findJsExtension(loadingPathWithoutExtension)) ?? defaultExtension;
  const loadingPath = loadingPathWithoutExtension + "." + loadingFileExtension;

  const packageManager = await getPackageManager();
  const versionCommand = `${packageManager} --version`;
  const installCommand =
    packageManager === "yarn" ? "yarn add" : `${packageManager} install`;

  try {
    await shellNicelyFormatted(versionCommand, { shell: true, quiet: true });
  } catch (err) {
    throw new UserError(
      `Could not run the package manager command '${versionCommand}'. Please make sure ${packageManager} is installed on your system.`
    );
  }

  const stackPackageName = process.env.STACK_PACKAGE_NAME_OVERRIDE || "@stackframe/stack";

  const isReady = await inquirer.prompt([
    {
      type: "confirm",
      name: "ready",
      message: `Found a Next.js project at ${projectPath} — ready to install Stack?`,
      default: true,
    },
  ]);
  if (!isReady.ready) {
    throw new UserError("Installation aborted.");
  }

  console.log();
  console.log(`${ansis.bold}Installing dependencies...${ansis.clear}`);
  await shellNicelyFormatted(`${installCommand} ${stackPackageName}`, {
    shell: true,
    cwd: projectPath,
  });

  console.log();
  console.log(`${ansis.bold}Writing files...${ansis.clear}`);
  console.log();
  if (potentialEnvLocations.every((p) => !fs.existsSync(p))) {
    await writeFile(
      envLocalPath,
      "# Stack Auth keys\n# Get these variables by creating a project on https://app.stack-auth.com.\nNEXT_PUBLIC_STACK_PROJECT_ID=\nNEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=\nSTACK_SECRET_SERVER_KEY=\n"
    );
  }
  await writeFileIfNotExists(
    loadingPath,
    `export default function Loading() {\n${ind}// Stack uses React Suspense, which will render this page while user data is being fetched.\n${ind}// See: https://nextjs.org/docs/app/api-reference/file-conventions/loading\n${ind}return <></>;\n}\n`
  );
  await writeFileIfNotExists(
    handlerPath,
    `import { StackHandler } from "@stackframe/stack";\nimport { stackServerApp } from "../../../stack";\n\nexport default function Handler(props${
      handlerFileExtension.includes("ts") ? ": unknown" : ""
    }) {\n${ind}return <StackHandler fullPage app={stackServerApp} routeProps={props} />;\n}\n`
  );
  await writeFileIfNotExists(
    stackAppPath,
    `import "server-only";\n\nimport { StackServerApp } from "@stackframe/stack";\n\nexport const stackServerApp = new StackServerApp({\n${ind}tokenStore: "nextjs-cookie",\n});\n`
  );
  await writeFile(layoutPath, updatedLayoutContent);
  console.log(`${ansis.green}√${ansis.clear} Done writing files`);

  console.log();
  console.log();
  console.log();
  console.log(
    `${ansis.bold}${ansis.green}Installation succeeded!${ansis.clear}`
  );
  console.log();
  console.log("Commands executed:");
  for (const command of commandsExecuted) {
    console.log(`  ${ansis.blue}${command}${ansis.clear}`);
  }
  console.log();
  console.log("Files written:");
  for (const file of filesModified) {
    console.log(`  ${ansis.yellow}${file}${ansis.clear}`);
  }
  for (const file of filesCreated) {
    console.log(`  ${ansis.green}${file}${ansis.clear}`);
  }
}
main()
  .then(async () => {
    console.log();
    console.log();
    console.log();
    console.log();
    console.log(
      `${ansis.green}===============================================${ansis.clear}`
    );
    console.log();
    console.log(
      `${ansis.green}Successfully installed Stack! 🚀🚀🚀${ansis.clear}`
    );
    console.log();
    console.log("Next steps:");
    console.log(
      "  1. Create an account and project on https://app.stack-auth.com"
    );
    console.log(
      "  2. Copy the environment variables from the new API key into your .env.local file"
    );
    console.log();
    console.log(
      "Then, you will be able to access your sign-in page on http://your-website.example.com/handler/sign-in. That's it!"
    );
    console.log();
    console.log(
      `${ansis.green}===============================================${ansis.clear}`
    );
    console.log();
    console.log(
      "For more information, please visit https://docs.stack-auth.com/getting-started/setup"
    );
    console.log();
    if (!process.env.STACK_DISABLE_INTERACTIVE) {
      await open("https://app.stack-auth.com/wizard-congrats");
    }
  })
  .catch((err) => {
    if (!(err instanceof UserError)) {
      console.error(err);
    }
    console.error();
    console.error();
    console.error();
    console.error();
    console.error(
      `${ansis.red}===============================================${ansis.clear}`
    );
    console.error();
    if (err instanceof UserError) {
      console.error(`${ansis.red}ERROR!${ansis.clear} ${err.message}`);
    } else {
      console.error("An error occurred during the initialization process.");
    }
    console.error();
    console.error(
      `${ansis.red}===============================================${ansis.clear}`
    );
    console.error();
    console.error(
      "If you need assistance, please try installing Stack manually as described in https://docs.stack-auth.com/getting-started/setup or join our Discord where we're happy to help: https://discord.stack-auth.com"
    );
    if (!(err instanceof UserError)) {
      console.error("");
      console.error(`Error message: ${err.message}`);
    }
    console.error();
    process.exit(1);
  });

async function getUpdatedLayout(originalLayout) {
  let layout = originalLayout;
  const indentation = guessIndentation(originalLayout);

  const firstImportLocationM1 = /\simport\s/.exec(layout)?.index;
  const hasStringAsFirstLine = layout.startsWith('"') || layout.startsWith("'");
  const importInsertLocationM1 =
    firstImportLocationM1 ?? (hasStringAsFirstLine ? layout.indexOf("\n") : -1);
  const importInsertLocation = importInsertLocationM1 + 1;
  const importStatement = `import { StackProvider, StackTheme } from "@stackframe/stack";\nimport { stackServerApp } from "../stack";\n`;
  layout =
    layout.slice(0, importInsertLocation) +
    importStatement +
    layout.slice(importInsertLocation);

  const bodyOpenTag = /<\s*body[^>]*>/.exec(layout);
  const bodyCloseTag = /<\s*\/\s*body[^>]*>/.exec(layout);
  if (!bodyOpenTag || !bodyCloseTag) {
    return undefined;
  }
  const bodyOpenEndIndex = bodyOpenTag.index + bodyOpenTag[0].length;
  const bodyCloseStartIndex = bodyCloseTag.index;
  if (bodyCloseStartIndex <= bodyOpenEndIndex) {
    return undefined;
  }

  const lines = layout.split("\n");
  const [bodyOpenEndLine, bodyOpenEndIndexInLine] = getLineIndex(
    lines,
    bodyOpenEndIndex
  );
  const [bodyCloseStartLine, bodyCloseStartIndexInLine] = getLineIndex(
    lines,
    bodyCloseStartIndex
  );

  const insertOpen = "<StackProvider app={stackServerApp}><StackTheme>";
  const insertClose = "</StackTheme></StackProvider>";

  layout =
    layout.slice(0, bodyCloseStartIndex) +
    insertClose +
    layout.slice(bodyCloseStartIndex);
  layout =
    layout.slice(0, bodyOpenEndIndex) +
    insertOpen +
    layout.slice(bodyOpenEndIndex);

  return {
    content: `${layout}`,
    indentation,
  };
}

function guessIndentation(str) {
  const lines = str.split("\n");
  const linesLeadingWhitespaces = lines
    .map((line) => line.match(/^\s*/)[0])
    .filter((ws) => ws.length > 0);
  const isMostlyTabs =
    linesLeadingWhitespaces.filter((ws) => ws.includes("\t")).length >=
    (linesLeadingWhitespaces.length * 2) / 3;
  if (isMostlyTabs) return "\t";
  const linesLeadingWhitespacesCount = linesLeadingWhitespaces.map(
    (ws) => ws.length
  );
  const min = Math.min(Infinity, ...linesLeadingWhitespacesCount);
  return Number.isFinite(min) ? " ".repeat(Math.max(2, min)) : "  ";
}

function getLineIndex(lines, stringIndex) {
  let lineIndex = 0;
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    if (stringIndex < lineIndex + line.length) {
      return [l, stringIndex - lineIndex];
    }
    lineIndex += line.length + 1;
  }
  throw new Error(
    `Index ${stringIndex} is out of bounds for lines ${JSON.stringify(lines)}`
  );
}

async function getProjectPath() {
  if (savedProjectPath === undefined) {
    savedProjectPath = process.cwd();

    const askForPathModification = !fs.existsSync(
      path.join(savedProjectPath, "package.json")
    );
    if (askForPathModification) {
      savedProjectPath = (
        await inquirer.prompt([
          {
            type: "input",
            name: "newPath",
            message: "Please enter the path to your project:",
            default: ".",
          },
        ])
      ).newPath;
    }
  }
  return savedProjectPath;
}

async function findJsExtension(fullPathWithoutExtension) {
  for (const ext of jsLikeFileExtensions) {
    const fullPath = fullPathWithoutExtension + "." + ext;
    if (fs.existsSync(fullPath)) {
      return ext;
    }
  }
  return null;
}

async function getPackageManager() {
  const projectPath = await getProjectPath();
  const yarnLock = fs.existsSync(path.join(projectPath, "yarn.lock"));
  const pnpmLock = fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"));
  const npmLock = fs.existsSync(path.join(projectPath, "package-lock.json"));
  const bunLock = fs.existsSync(path.join(projectPath, "bun.lockb"));

  if (yarnLock && !pnpmLock && !npmLock && !bunLock) {
    return "yarn";
  } else if (!yarnLock && pnpmLock && !npmLock && !bunLock) {
    return "pnpm";
  } else if (!yarnLock && !pnpmLock && npmLock && !bunLock) {
    return "npm";
  } else if (!yarnLock && !pnpmLock && !npmLock && bunLock) {
    return "bun";
  }

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "packageManager",
      message: "Which package manager are you using for this project?",
      choices: ["npm", "yarn", "pnpm", "bun"],
    },
  ]);
  return answers.packageManager;
}

async function shellNicelyFormatted(command, { quiet, ...options }) {
  console.log();
  const ui = new inquirer.ui.BottomBar();
  let dots = 4;
  ui.updateBottomBar(
    `${ansis.blue}Running command: ${command}...${ansis.clear}`
  );
  const interval = setInterval(() => {
    if (!isDryRun) {
      ui.updateBottomBar(
        `${ansis.blue}Running command: ${command}${".".repeat(dots++ % 5)}${
          ansis.clear
        }`
      );
    }
  }, 700);
  try {
    if (!isDryRun) {
      const child = child_process.spawn(command, options);
      if (!quiet) {
        child.stdout.pipe(ui.log);
        child.stderr.pipe(ui.log);
      }

      await new Promise((resolve, reject) => {
        child.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Command ${command} failed with code ${code}`));
          }
        });
      });
    } else {
      console.log(`[DRY-RUN] Would have run: ${command}`);
    }

    if (!quiet) {
      commandsExecuted.push(command);
    }
  } finally {
    clearTimeout(interval);
    ui.updateBottomBar(
      quiet
        ? ""
        : `${ansis.green}√${ansis.clear} Command ${command} succeeded\n`
    );
    ui.close();
  }
}

async function readFile(fullPath) {
  try {
    if (!isDryRun) {
      return fs.readFileSync(fullPath, "utf-8");
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

async function writeFile(fullPath, content) {
  let create = !fs.existsSync(fullPath);
  if (!isDryRun) {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
  } else {
    console.log(`[DRY-RUN] Would have written to ${fullPath}`);
  }
  const relativeToProjectPath = path.relative(await getProjectPath(), fullPath);
  if (!create) {
    filesModified.push(relativeToProjectPath);
  } else {
    filesCreated.push(relativeToProjectPath);
  }
}

async function writeFileIfNotExists(fullPath, content) {
  if (!fs.existsSync(fullPath)) {
    await writeFile(fullPath, content);
  }
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throwErr(message) {
  throw new Error(message);
}
