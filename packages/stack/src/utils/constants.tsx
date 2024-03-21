export const FONT_SIZES = {'xs': '0.75rem', 'sm': '0.875rem', 'md': '1rem', 'lg': '1.25rem', 'xl': '1.5rem'};
export const LINE_HEIGHTS = {'xs': '1rem', 'sm': '1.25rem', 'md': '1.5rem', 'lg': '1.75rem', 'xl': '2rem'};
export const FONT_FAMILY = 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
export const PRIMARY_FONT_COLORS = { 'dark': 'white', 'light': 'black' };
export const SECONDARY_FONT_COLORS = { 'dark': '#a8a8a8', 'light': '#737373' };
export const BORDER_RADIUS = '0.375rem';
export const DEFAULT_COLORS = ({
  dark: {
    primaryColor: '#570df8',
    secondaryColor: '#404040',
    primaryBgColor: 'black',
    secondaryBgColor: '#1f1f1f',
    neutralColor: '#27272a',
  },
  light: {
    primaryColor: '#570df8',
    secondaryColor: '#e0e0e0',
    primaryBgColor: 'white',
    secondaryBgColor: '#474747',
    neutralColor: '#e4e4e7',
  },
} as const);