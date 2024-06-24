import { ColorPalette } from "..";

// Note that this script can not import anything from outside as it will be converted to a string and executed in the browser.
// Also please note that there might be hydration issues with this script, always check the browser console for errors after changing this script.
const script = (colors: { light: Record<string, string>, dark: Record<string, string> }) => {
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

  function colorsToCSSVars(colors: Record<string, string>) {
    return Object.entries(colors).map((params) => { 
      return "--" + params[0] + ": " + params[1] + ";\n";
    }).join('');
  }
  
  const cssVars = '.stack-scope {\n' + colorsToCSSVars(colors.light) + '}\n[data-stack-theme="dark"] .stack-scope {\n' + colorsToCSSVars(colors.dark) + '}';
  const style = document.createElement('style');
  style.textContent = cssVars;
  style.id = 'stack-css-vars';
  document.head.appendChild(style);
};

function convertKeysToDashCase(obj: Record<string, string>) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`), value]));
}

export function BrowserScript(props: { colors: ColorPalette }) {
  const convertedColors = {
    light: convertKeysToDashCase(props.colors.light),
    dark: convertKeysToDashCase(props.colors.dark),
  };
  return (
    <script dangerouslySetInnerHTML={{ __html: `(${script.toString()})(${JSON.stringify(convertedColors)})` }}/>
  );
}