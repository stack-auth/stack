export const FONT_SIZES = {'xs': '0.75rem', 'sm': '0.875rem', 'md': '1rem', 'lg': '1.125rem', 'xl': '1.25rem'} as const;
export const LINE_HEIGHTS = {'xs': '1rem', 'sm': '1.25rem', 'md': '1.5rem', 'lg': '1.75rem', 'xl': '2rem'} as const;
export const FONT_FAMILY = 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
export const PRIMARY_FONT_COLORS = { 'dark': 'white', 'light': 'black' } as const;
export const SECONDARY_FONT_COLORS = { 'dark': '#a8a8a8', 'light': '#737373' } as const;
export const SELECTED_BACKGROUND_COLORS = { 'dark': 'rgba(255, 255, 255, 0.1)', 'light': 'rgba(0, 0, 0, 0.04)' } as const;
export const LINK_COLORS = { 'dark': '#fff', 'light': '#000' } as const;
export const SHADOW = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
export const DEFAULT_COLORS = ({
  dark: {
    primaryColor: '#ffffff',
    secondaryColor: '#27272a',
    backgroundColor: '#000000',
    neutralColor: '#27272a',
  },
  light: {
    primaryColor: '#000000',
    secondaryColor: '#f4f4f5',
    backgroundColor: '#ffffff',
    neutralColor: '#e4e4e7',
  },
} as const);