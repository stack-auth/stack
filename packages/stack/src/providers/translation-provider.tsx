import { quetzalLocales, quetzalKeys } from "../generated/quetzal-translations";
import { TranslationProviderClient } from "./translation-provider-client";

export async function TranslationProvider({ lang, children }: {
  lang: Parameters<typeof quetzalLocales.get>[0] | undefined,
  children: React.ReactNode,
}) {
  const locale = quetzalLocales.get(lang ?? (undefined as never));
  if (!locale) {
    throw new Error(`No messages found for locale: ${lang}`);
  }
  return <TranslationProviderClient quetzalKeys={quetzalKeys} quetzalLocale={locale}>
    {children}
  </TranslationProviderClient>;
}
