// Note that this script can not import anything from outside as it will be converted to a string and executed in the browser.

import { SsrScript } from "../components/elements/ssr-layout-effect";

// Also please note that there might be hydration issues with this script, always check the browser console for errors after changing this script.
const script = () => {
  const attributes = ['data-joy-color-scheme', 'data-mui-color-scheme', 'data-theme', 'data-color-scheme', 'class'];

  const getColorMode = (value: string) => {
    if (value.includes('dark')) {
      return 'dark';
    }
    if (value.includes('light')) {
      return 'light';
    }
    return null;
  };

  const setTheme = (mode: 'dark' | 'light') => {
    document.documentElement.setAttribute('data-stack-theme', mode);
  };

  const colorToRGB = (color: string): [number, number, number] | null => {
    // Create a temporary element to use for color conversion
    const temp = document.createElement('div');
    temp.style.color = color;
    document.body.appendChild(temp);

    // Get the computed style
    const computedColor = getComputedStyle(temp).color;
    document.body.removeChild(temp);

    // Parse the RGB values
    const match = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }

    return null;
  };

  const rgbToLuma = (rgb: [number, number, number]) => {
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  };

  const copyFromColorScheme = () => {
    const colorScheme = getComputedStyle(document.documentElement).getPropertyValue('color-scheme');

    if (colorScheme) {
      const mode = getColorMode(colorScheme);
      if (mode) {
        setTheme(mode);
        return true;
      }
    }
    return false;
  };

  const copyFromVariables = () => {
    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--background');
    if (backgroundColor) {
      // convert backgroundColor to hsl and check if it's dark
      const rgb = colorToRGB(backgroundColor);
      if (rgb) {
        const luma = rgbToLuma(rgb);
        console.log('luma', luma);
        if (luma < 128) {
          setTheme('dark');
        } else {
          setTheme('light');
        }
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
          setTheme(mode);
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
      if (copyFromVariables()) {
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
    if (!copyFromVariables()) {
      copyFromAttributes();
    }
  }
};

export function BrowserScript(props : { nonce?: string }) {
  return <SsrScript nonce={props.nonce} script={`(${script.toString()})()`}/>;
}
