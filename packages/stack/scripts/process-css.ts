import * as fs from 'fs';
import * as path from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import postcssNested from 'postcss-nested';
import { replaceAll } from '@stackframe/stack-shared/dist/utils/strings';

const sentinel = '--stack-sentinel--';

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.error('Please provide exactly three arguments: input file path, output file path, and scope name');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);
  const scopeName = args[2];

  let content = fs.readFileSync(inputPath, 'utf8');

  // set the scope and sentinel, sentinel is used for same level selectors later
  content = `.${scopeName}, .${sentinel} {\n${content}\n}`;

  // use postcss to nest the scope
  content = await postcss([autoprefixer, postcssNested]).process(content, { from: undefined }).css;

  // swap the case like .scope img to img.scope
  content = content.replace(/(\.--stack-sentinel--\s)([*a-zA-Z0-9\-]+)([^,{\n]*)/g, `$2.${scopeName}$3`)

  // replace the remaining sentinels
  content = replaceAll(content, sentinel + ' ', scopeName);

  // remove all :root
  content = replaceAll(content, ':root', '');

  // double check that all sentinels were replaced
  if (content.includes(sentinel)) {
    throw new Error('Sentinel not replaced');
  }

  // output css file for debugging
  fs.writeFileSync(outputPath.replace(/\.ts$/, '.css'), content);

  content = JSON.stringify(content);
  content = "export const globalCSS = " + content + ";";

  fs.writeFileSync(outputPath, content);

}

main().catch(err => {
  console.error(err);
  process.exit(1);
});