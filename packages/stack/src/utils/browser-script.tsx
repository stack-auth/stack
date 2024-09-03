// Note that this script can not import anything from outside as it will be converted to a string and executed in the browser.
import { SsrScript } from "../components/elements/ssr-layout-effect";

// Also please note that there might be hydration issues with this script, always check the browser console for errors after changing this script.
const script = () => {
  const attributes = ["data-joy-color-scheme", "data-mui-color-scheme", "data-theme", "data-color-scheme", "class"];

  const getColorMode = (value: string) => {
    if (value.includes("dark")) {
      return "dark";
    }
    if (value.includes("light")) {
      return "light";
    }
    return null;
  };

  const copyFromColorScheme = () => {
    const colorScheme = getComputedStyle(document.documentElement).getPropertyValue("color-scheme");
    if (colorScheme) {
      const mode = getColorMode(colorScheme);
      if (mode) {
        document.documentElement.setAttribute("data-stack-theme", mode);
        return true;
      }
    }
    return false;
  };

  const copyFromAttributes = () => {
    for (const attributeName of attributes) {
      const colorTheme = document.documentElement.getAttribute(attributeName);
      if (colorTheme) {
        const mode = getColorMode(colorTheme);
        if (mode) {
          document.documentElement.setAttribute("data-stack-theme", mode);
          return true;
        }
      }
    }
    return false;
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (copyFromColorScheme()) {
        return;
      }
      if (mutation.attributeName && attributes.includes(mutation.attributeName)) {
        copyFromAttributes();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: attributes,
  });

  // Initial check on page load
  if (!copyFromColorScheme()) {
    copyFromAttributes();
  }
};

export function BrowserScript(props: { nonce?: string }) {
  return <SsrScript nonce={props.nonce} script={`(${script.toString()})()`} />;
}
