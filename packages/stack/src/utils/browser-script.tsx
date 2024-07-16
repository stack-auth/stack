// Note that this script can not import anything from outside as it will be converted to a string and executed in the browser.

import { SsrScript } from "../components/elements/ssr-layout-effect";

// Also please note that there might be hydration issues with this script, always check the browser console for errors after changing this script.
const script = () => {
  const attributes = ['data-joy-color-scheme', 'data-mui-color-scheme', 'data-theme', 'data-color-scheme', 'class'];

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      for (const attributeName of attributes) {
        if (mutation.attributeName === attributeName) {
          const colorTheme = document.documentElement.getAttribute(attributeName);
          if (!colorTheme) {
            continue;
          }
          const darkMode = colorTheme.includes('dark');
          const lightMode = colorTheme.includes('light');
          if (!darkMode && !lightMode) {
            continue;
          }
          document.documentElement.setAttribute('data-stack-theme', darkMode ? 'dark' : 'light');
        }
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: attributes,
  });
};

export function BrowserScript(props : { nonce?: string }) {
  return <SsrScript nonce={props.nonce} script={`(${script.toString()})()`}/>;
}