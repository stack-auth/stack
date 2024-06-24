export const FONT_SIZES = {'xs': '0.75rem', 'sm': '0.875rem', 'md': '1rem', 'lg': '1.125rem', 'xl': '1.25rem'} as const;
export const LINE_HEIGHTS = {'xs': '1rem', 'sm': '1.25rem', 'md': '1.5rem', 'lg': '1.75rem', 'xl': '2rem'} as const;
export const FONT_FAMILY = 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
export const PRIMARY_FONT_COLORS = { 'dark': 'white', 'light': 'black' } as const;
export const SECONDARY_FONT_COLORS = { 'dark': '#a8a8a8', 'light': '#737373' } as const;
export const SELECTED_BACKGROUND_COLORS = { 'dark': 'rgba(255, 255, 255, 0.1)', 'light': 'rgba(0, 0, 0, 0.04)' } as const;
export const LINK_COLORS = { 'dark': '#fff', 'light': '#000' } as const;
export const SHADOW = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';

export const DEFAULT_COLORS = ({
  light: {
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    card: '0 0% 100%',
    cardForeground: '240 10% 3.9%', 
    popover: '0 0% 100%',
    popoverForeground: '240 10% 3.9%',
    primary: '240 5.9% 10%',
    primaryForeground: '0 0% 98%',
    secondary: '240 4.8% 95.9%',
    secondaryForeground: '240 5.9% 10%',
    muted: '240 4.8% 95.9%',
    mutedForeground: '240 3.8% 46.1%',
    accent: '240 4.8% 95.9%',
    accentForeground: '240 5.9% 10%',
    destructive: '0 84.2% 60.2%',
    destructiveForeground: '0 0% 98%',
    border: '240 5.9% 90%',
    input: '240 5.9% 90%',
    ring: '240 10% 3.9%',
    radius: '0.5rem',
  },
  dark: {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    card: '240 10% 3.9%',
    cardForeground: '0 0% 98%',
    popover: '240 10% 3.9%',
    popoverForeground: '0 0% 98%',
    primary: '0 0% 98%',
    primaryForeground: '240 5.9% 10%',
    secondary: '240 3.7% 15.9%',
    secondaryForeground: '0 0% 98%',
    muted: '240 3.7% 15.9%',
    mutedForeground: '240 5% 64.9%',
    accent: '240 3.7% 15.9%',
    accentForeground: '0 0% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 98%',
    border: '240 3.7% 15.9%',
    input: '240 3.7% 15.9%',
    ring: '240 4.9% 83.9%',
    radius: '0.5rem',
  },
} as const);