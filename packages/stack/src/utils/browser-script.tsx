const script = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-joy-color-scheme') {
        const joyColorScheme = document.documentElement.getAttribute('data-joy-color-scheme');
        if (!joyColorScheme) {
          return;
        }
        document.documentElement.setAttribute('data-theme', joyColorScheme);
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-joy-color-scheme'],
  });
};

export function BrowserScript() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `(${script.toString()})()` }}/>
  );
}