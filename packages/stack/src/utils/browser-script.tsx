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

export function BrowserScript() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `(${script.toString()})()` }}/>
  );
}