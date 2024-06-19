import * as fs from 'fs';
import * as path from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import postcssNested from 'postcss-nested';

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.error('Please provide exactly three arguments: input file path, output file path, and wrap string');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);
  const wrapString = args[2];

  let content = fs.readFileSync(inputPath, 'utf8');
  content = `.${wrapString} {\n${content}\n}`;
  content = await postcss([autoprefixer, postcssNested]).process(content, { from: undefined }).css;
  content = content.replace(/`/g, '\\`');
  content = "export const globalCSS = \`\n" + content + "\n\`;";

  fs.writeFileSync(outputPath, content);

}

main().catch(err => {
  console.error(err);
  process.exit(1);
});