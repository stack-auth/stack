import { deindent } from "@stackframe/stack-shared/dist/utils/strings";

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

  const cssVars = `
  .stack-scope {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;

    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;

    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;

    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;

    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;

    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;

    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;

    --radius: 0.5rem;
  }

  [data-stack-theme="dark"] .stack-scope {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;

    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;

    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;

    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;

    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;

    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;

    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;

    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
  `;

  const style = document.createElement('style');
  style.textContent = cssVars;
  style.id = 'stack-css-vars';
  document.head.appendChild(style);
};

export function BrowserScript() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `(${script.toString()})()` }}/>
  );
}