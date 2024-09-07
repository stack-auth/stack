import { deindent } from "@stackframe/stack-shared/dist/utils/strings";
import * as fs from "fs";
import quetzalKeys from "../quetzal-translations/keystore.json";
import supportedLocales from "../quetzal-translations/supported-locales.json";

async function main() {
  const locales = Object.fromEntries(await Promise.all(supportedLocales.map(async (locale) => [
    locale,
    (await import(`../quetzal-translations/${locale}.json`)).default
  ] as const)));

  // replace Quetzal's auto-generated IDs (like k-0, k-1, etc.) with our own
  // we do this because Quetzal's IDs are not stable when running the script multiple times
  const oldKeysReversed = Object.fromEntries(Object.entries(quetzalKeys).sort().map(([key, value]) => [value, key]));
  const newKeys = Object.fromEntries(Object.keys(quetzalKeys).sort().map((key, i) => [key, `__stack-auto-translation-${i}`]));
  const localesByKeys = Object.fromEntries(Object.entries(locales).sort().map(([key, value]) => [
    key,
    Object.fromEntries(Object.entries(value).sort().map(([key, value]) => [oldKeysReversed[key], value]))
  ]));

  fs.writeFileSync("src/generated/quetzal-translations.ts", deindent`
    import { typedEntries } from "@stackframe/stack-shared/dist/utils/objects";


    export const quetzalKeys = new Map(typedEntries(${JSON.stringify(newKeys, null, 2)} as const));


    export const quetzalLocales = new Map(typedEntries({
      ${supportedLocales.map(locale => deindent`
        ${JSON.stringify(locale)}: new Map(typedEntries(${JSON.stringify(localesByKeys[locale], null, 2)} as const)),
      `).join("\n")}
    } as const));
  `);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
