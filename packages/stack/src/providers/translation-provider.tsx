import { quetzalLocales, quetzalKeys } from "../generated/quetzal-translations";
import { TranslationProviderClient } from "./translation-provider-client";

export async function TranslationProvider({ lang, children }: {
  lang: Parameters<typeof quetzalLocales.get>[0] | undefined,
  children: React.ReactNode,
}) {
  const locale = quetzalLocales.get(lang ?? (undefined as never));
  return <TranslationProviderClient quetzalKeys={quetzalKeys} quetzalLocale={locale ?? new Map()}>
    {children}
  </TranslationProviderClient>;
}
