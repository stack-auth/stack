import { deindent } from "@stackframe/stack-shared/dist/utils/strings";
import * as fs from "fs";
import quetzalKeys from "../quetzal-translations/keystore.json";
import supportedLocales from "../quetzal-translations/supported-locales.json";

async function main() {
  const locales = Object.fromEntries(await Promise.all(supportedLocales.map(async (locale) => [
    locale,
    (await import(`../quetzal-translations/${locale}.json`)).default
  ] as const)));

  fs.writeFileSync("src/generated/quetzal-translations.ts", deindent`
    import { typedEntries } from "@stackframe/stack-shared/dist/utils/objects";


    export const quetzalKeys = new Map(typedEntries(${JSON.stringify(quetzalKeys, null, 2)} as const));


    export const quetzalLocales = new Map(typedEntries({
      ${supportedLocales.map(locale => deindent`
        ${JSON.stringify(locale)}: new Map(typedEntries(${JSON.stringify(locales[locale], null, 2)} as const)),
      `).join("\n")}
    } as const));
  `);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
