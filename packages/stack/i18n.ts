import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

let supportedLocales: string[] = [];

function findSupportedLocaleFor(locale: string) {
    //Take a preferred locale from the user and see if we have a match for them
    if (supportedLocales.includes(locale)) return locale;

    const plc = getLanguageCode(locale);
    for (let slind = 0; slind < supportedLocales.length; slind++) {
        const sl = supportedLocales[slind];
        const slc = getLanguageCode(sl);
        if (slc == plc) return sl;
    }
}

function getLanguageCode(localeString: string): string {
    const dashIndex = localeString.indexOf("-");
    return dashIndex === -1 ? localeString : localeString.slice(0, dashIndex);
}

export default getRequestConfig(async () => {
    const headersList = headers();
    const acceptLanguage = headersList.get("accept-language");

    try {
        supportedLocales = (
            await import("./quetzal-translations/supported-locales.json")
        ).default;
    } catch (error) {
        console.warn(
            "Failed to load supported locales, using english as fallback"
        );
    }

    if (supportedLocales.length == 0) supportedLocales = ["en-US"];
    let locale = supportedLocales.includes("en-US")
        ? "en-US"
        : supportedLocales[0]; // Default locale

    if (acceptLanguage) {
        const preferredLocales = acceptLanguage.split(",").map((lang) => {
            const [locale] = lang.split(";");
            return locale.trim();
        });

        const matchedLocale =
            preferredLocales.reduce<string | null>((matched, pref) => {
                if (matched) return matched;
                return findSupportedLocaleFor(pref) || matched;
            }, null) || locale;

        if (matchedLocale) {
            locale = matchedLocale;
        }
    }

    let messages = {};
    try {
        messages = (await import(`./quetzal-translations/${locale}.json`))
            .default;
    } catch (error) {
        console.warn(`No message file found for locale: ${locale}`);
    }

    return {
        locale,
        messages,
    };
});
