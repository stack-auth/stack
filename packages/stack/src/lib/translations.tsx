import "client-only";
import React from "react";
import { TranslationContext } from "../providers/translation-provider-client";

export function useTranslation() {
  const translationContext = React.useContext(TranslationContext);
  if (!translationContext) {
    throw new Error("Translation context not found; did you forget to wrap your app in a <StackProvider />?");
  }
  return {
    t: (str: string) => {
      const { quetzalKeys, quetzalLocale } = translationContext;
      return quetzalLocale.get(quetzalKeys.get(str) ?? (undefined as never)) ?? str;
    },
  };
}
