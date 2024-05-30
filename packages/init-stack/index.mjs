#!/usr/bin/env node

import inquirer from 'inquirer';
import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import open from 'open';

const jsLikeFileExtensions = ['mtsx', 'ctsx', 'tsx', 'mts', 'cts', 'ts', 'mjsx', 'cjsx', 'jsx', 'mjs', 'cjs', 'js'];

async function main() {
  console.log("Welcome to the Stack installation wizard! 🧙‍♂️");

  const projectPath = getProjectPath();
  if (!fs.existsSync(projectPath)) {
    throw new Error(`The project path ${projectPath} does not exist`);
  }

  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`The package.json file does not exist in the project path ${projectPath}. You must initialize a new project first before installing Stack.`);
  }

  const nextConfigPathWithoutExtension = path.join(projectPath, 'next.config');
  const nextConfigFileExtension = await findJsExtension(nextConfigPathWithoutExtension);
  const nextConfigPath = nextConfigPathWithoutExtension + '.' + nextConfigFileExtension;
  if (!fs.existsSync(nextConfigPath)) {
    throw new Error(`Expected file at ${nextConfigPath}. Only Next.js projects are currently supported supported.`);
  }

  const envLocalPath = path.join(projectPath, '.env.local');

  const hasSrcFolder = fs.existsSync(path.join(projectPath, 'src'));
  const srcPath = path.join(projectPath, hasSrcFolder ? 'src' : '');
  const appPath = path.join(srcPath, 'app');
  if (!fs.existsSync(appPath)) {
    throw new Error(`The app path ${appPath} does not exist. Only the Next.js app router is supported.`);
  }

  const layoutPathWithoutExtension = path.join(appPath, 'layout');
  const layoutFileExtension = await findJsExtension(layoutPathWithoutExtension) ?? "jsx";
  const layoutPath = layoutPathWithoutExtension + '.' + layoutFileExtension;
  const layoutContent = await readFile(layoutPath) ?? throwErr(`The layout file at ${layoutPath} does not exist. Stack requires a layout file to be present in the /app folder.`);
  const updatedLayoutResult = await getUpdatedLayout(layoutContent) ?? throwErr("Unable to parse root layout file. Make sure it contains a <body> tag. If it still doesn't work, you may need to manually install Stack. See: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required");
  const updatedLayoutContent = updatedLayoutResult.content;

  const defaultExtension = layoutFileExtension;
  const ind = updatedLayoutResult.indentation;

  
  const stackAppPathWithoutExtension = path.join(srcPath, 'stack');
  const stackAppFileExtension = await findJsExtension(stackAppPathWithoutExtension) ?? defaultExtension;
  const stackAppPath = stackAppPathWithoutExtension + '.' + stackAppFileExtension;
  const stackAppContent = await readFile(stackAppPath);
  if (stackAppContent) {
    if (!stackAppContent.includes("@stackframe/stack")) {
      throw new Error(`A file at the path ${stackAppPath} already exists. Stack uses the /src/stack-app file to initialize the Stack SDK. Please remove the existing file and try again.`);
    }
    throw new Error(`It seems that you've already installed Stack in this project.`);
  }


  const handlerPathWithoutExtension = path.join(appPath, 'handler/[...stack]/page');
  const handlerFileExtension = await findJsExtension(handlerPathWithoutExtension) ?? defaultExtension;
  const handlerPath = handlerPathWithoutExtension + '.' + handlerFileExtension;
  const handlerContent = await readFile(handlerPath);
  if (handlerContent && !handlerContent.includes("@stackframe/stack")) {
    throw new Error(`A file at the path ${handlerPath} already exists. Stack uses the /handler path to handle incoming requests. Please remove the existing file and try again.`);
  }


  let loadingPathWithoutExtension = path.join(appPath, 'loading');
  const loadingFileExtension = await findJsExtension(loadingPathWithoutExtension) ?? defaultExtension;
  const loadingPath = loadingPathWithoutExtension + '.' + loadingFileExtension;

  console.log();
  console.log("Found supported project at:", projectPath);
  console.log("Installing now! 💃");

  const packageManager = await getPackageManager();
  const versionCommand = `${packageManager} --version`;
  const installCommand = packageManager === 'yarn' ? 'yarn add' : `${packageManager} install`;

  process.stdout.write("\nChecking package manager version... ");
  try {
    await shellNicelyFormatted(versionCommand, { shell: true });
  } catch (err) {
    throw new Error(`Could not run the package manager command ${versionCommand}. Please make sure ${packageManager} is installed on your system.`);
  }

  console.log();
  console.log("Installing dependencies...");
  await shellNicelyFormatted(`${installCommand} @stackframe/stack`, { shell: true, cwd: projectPath });
  
  console.log();
  console.log("Writing files...");
  await writeFileIfNotExists(envLocalPath, "NEXT_PUBLIC_STACK_PROJECT_ID=\nNEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=\nSTACK_SECRET_SERVER_KEY=\n");
  await writeFileIfNotExists(loadingPath, `export default function Loading() {\n${ind}// Stack uses React Suspense, which will render this page while user data is being fetched.\n${ind}// See: https://nextjs.org/docs/app/api-reference/file-conventions/loading\n${ind}return <></>;\n}\n`);
  await writeFileIfNotExists(handlerPath, `import { StackHandler } from "@stackframe/stack";\nimport { stackServerApp } from "../../../stack";\n\nexport default function Handler(props${handlerFileExtension.includes("ts") ? ": any" : ""}) {\n${ind}return <StackHandler fullPage app={stackServerApp} {...props} />;\n}\n`);
  await writeFileIfNotExists(stackAppPath, `import "server-only";\n\nimport { StackServerApp } from "@stackframe/stack";\n\nexport const stackServerApp = new StackServerApp({\n${ind}tokenStore: "nextjs-cookie",\n});\n`);
  await writeFile(layoutPath, updatedLayoutContent);
  console.log("Files written successfully!");
}
main().then(async() => {
  console.log();
  console.log();
  console.log();
  console.log();
  console.log("===============================================");
  console.log();
  console.log("Successfully installed Stack! 🚀🚀🚀");
  console.log();
  console.log("Next up, please create an account on https://app.stack-auth.com to create a new project, and copy the Next.js environment variables from a new API key into your .env.local file.");
  console.log();
  console.log("Then, you will be able to access your sign-in page on http://your-website.example.com/handler/signin. Congratulations!");
  console.log();
  console.log("For more information, please visit https://docs.stack-auth.com/docs/getting-started/setup");
  console.log();
  console.log("===============================================");
  console.log();
  await open("https://app.stack-auth.com/wizard-congrats");
}).catch((err) => {
  console.error(err);
  console.error();
  console.error();
  console.error();
  console.error();
  console.error("===============================================");
  console.error();
  console.error("[ERR] An error occured during the initialization process. Please try manually installing Stack as described in https://docs.stack-auth.com/docs/getting-started/setup");
  console.error("[ERR]");
  console.error("[ERR] If you need assistance, please join our Discord where we're happy to help: https://discord.stack-auth.com");
  console.error("[ERR]");
  console.error(`[ERR] Error message: ${err.message}`);
  console.error();
  console.error("===============================================");
  console.error();
  process.exit(1);
});

async function getUpdatedLayout(originalLayout) {
  let layout = originalLayout;
  const indentation = guessIndentation(originalLayout);

  const firstImportLocationM1 = (/\simport\s/).exec(layout)?.index;
  const hasStringAsFirstLine = layout.startsWith('"') || layout.startsWith("'");
  const importInsertLocationM1 = firstImportLocationM1 ?? (hasStringAsFirstLine ? layout.indexOf('\n') : -1);
  const importInsertLocation = importInsertLocationM1 + 1;
  const importStatement = `import { StackProvider, StackTheme } from "@stackframe/stack";\nimport { stackServerApp } from "../stack";\n`;
  layout = layout.slice(0, importInsertLocation) + importStatement + layout.slice(importInsertLocation);

  
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

  const lines = layout.split('\n');
  const [bodyOpenEndLine, bodyOpenEndIndexInLine] = getLineIndex(lines, bodyOpenEndIndex);
  const [bodyCloseStartLine, bodyCloseStartIndexInLine] = getLineIndex(lines, bodyCloseStartIndex);

  const insertOpen = "<StackProvider app={stackServerApp}><StackTheme>";
  const insertClose = "</StackTheme></StackProvider>";

  layout = layout.slice(0, bodyCloseStartIndex) + insertClose + layout.slice(bodyCloseStartIndex);
  layout = layout.slice(0, bodyOpenEndIndex) + insertOpen + layout.slice(bodyOpenEndIndex);

  return {
    content: `${layout}`,
    indentation,
  };
}

function guessIndentation(str) {
  const lines = str.split('\n');
  const linesLeadingWhitespaces = lines.map((line) => line.match(/^\s*/)[0]).filter((ws) => ws.length > 0);
  const isMostlyTabs = linesLeadingWhitespaces.filter((ws) => ws.includes('\t')).length >= linesLeadingWhitespaces.length * 2 / 3;
  if (isMostlyTabs) return "\t";
  const linesLeadingWhitespacesCount = linesLeadingWhitespaces.map((ws) => ws.length);
  const min = Math.min(Infinity, ...linesLeadingWhitespacesCount);
  return Number.isFinite(min) ? ' '.repeat(Math.max(2, min)) : '  ';
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
  throw new Error(`Index ${stringIndex} is out of bounds for lines ${JSON.stringify(lines)}`);
}

function getProjectPath() {
  const path = process.argv[2] || process.cwd();
  return path;
}

async function findJsExtension(fullPathWithoutExtension) {
  for (const ext of jsLikeFileExtensions) {
    const fullPath = fullPathWithoutExtension + '.' + ext;
    if (fs.existsSync(fullPath)) {
      return ext;
    }
  }
  return null;
}

async function getPackageManager() {
  const yarnLock = fs.existsSync(path.join(getProjectPath(), 'yarn.lock'));
  const pnpmLock = fs.existsSync(path.join(getProjectPath(), 'pnpm-lock.yaml'));
  const npmLock = fs.existsSync(path.join(getProjectPath(), 'package-lock.json'));

  if (yarnLock && !pnpmLock && !npmLock) {
    return 'yarn';
  } else if (!yarnLock && pnpmLock && !npmLock) {
    return 'pnpm';
  } else if (!yarnLock && !pnpmLock && npmLock) {
    return 'npm';
  }

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager are you using for this project?',
      choices: ['npm', 'yarn', 'pnpm'],
    },
  ]);
  return answers.packageManager;
}

async function shellNicelyFormatted(command, options) {
  console.log();
  const ui = new inquirer.ui.BottomBar();
  ui.updateBottomBar(`Running command: ${command}...`);
  const child = child_process.spawn(command, options);
  child.stdout.pipe(ui.log);
  child.stderr.pipe(ui.log);

  await new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command ${command} failed with code ${code}`));
      }
    });
  });

  ui.updateBottomBar(`Command ${command} finished successfully!\n`);
  ui.close();
}

async function readFile(fullPath) {
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

async function writeFile(fullPath, content) {
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
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
