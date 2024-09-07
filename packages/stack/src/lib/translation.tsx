import "client-only";
import React from "react";
import { TranslationContext } from "../providers/translation-provider-client";

export function t(str: string) {
  // NOTE: This is not a hook, so we can't use other hooks.
  // The only exception is `React.use`, which is special, as we all know.

  const translationContext = React.use(TranslationContext);
  if (!translationContext) {
    throw new Error("Translation context not found; did you forget to wrap your app in a <StackProvider />?");
  }
  const { quetzalKeys, quetzalLocale } = translationContext;
  return quetzalLocale.get(quetzalKeys.get(str) ?? (undefined as never)) ?? str;
}
