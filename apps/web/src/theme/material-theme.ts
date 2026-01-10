import { createTheme, ThemeOptions } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Material Design 3 Color Tokens for GT7 Racing Theme
const colorTokens = {
  primary: {
    light: '#bb86fc',
    main: '#6200ea', // Purple primary
    dark: '#3700b3',
    contrastText: '#ffffff',
  },
  secondary: {
    light: '#e1bee7',
    main: '#9c27b0', // Purple secondary
    dark: '#6a1b9a',
    contrastText: '#ffffff',
  },
  tertiary: {
    light: '#f3e5f5',
    main: '#8e24aa', // Light purple
    dark: '#4a148c',
    contrastText: '#000000',
  },
  // Racing-specific colors for data visualization
  racing: {
    green: '#4caf50',    // Go/Optimal
    red: '#f44336',      // Stop/Critical
    orange: '#ff9800',   // Caution/Warning
    yellow: '#ffeb3b',   // Flag/Attention
    blue: '#2196f3',     // Information
  },
  error: {
    light: '#ef5350',
    main: '#f44336',
    dark: '#c62828',
    contrastText: '#ffffff',
  },
  warning: {
    light: '#ff9800',
    main: '#ed6c02',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  info: {
    light: '#03dac6',
    main: '#00bcd4',
    dark: '#00838f',
    contrastText: '#ffffff',
  },
  success: {
    light: '#4caf50',
    main: '#2e7d32',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  neutral: {
    0: '#000000',
    10: '#1a1a1a',
    20: '#2d2d2d',
    30: '#404040',
    40: '#595959',
    50: '#737373',
    60: '#8c8c8c',
    70: '#a6a6a6',
    80: '#bfbfbf',
    90: '#d9d9d9',
    95: '#f2f2f2',
    98: '#fafafa',
    99: '#fefefe',
    100: '#ffffff',
  },
  surface: {
    dim: '#0d1117',
    main: '#121212',
    bright: '#1e1e1e',
    containerLowest: '#0a0a0a',
    containerLow: '#1a1a1a',
    container: '#212121',
    containerHigh: '#2c2c2c',
    containerHighest: '#363636',
  },
};

// Material Design 3 Theme Configuration
const createMaterialDesign3Theme = (mode: 'light' | 'dark' = 'light'): ThemeOptions => ({
  palette: {
    mode,
    primary: colorTokens.primary,
    secondary: colorTokens.secondary,
    tertiary: colorTokens.tertiary,
    error: colorTokens.error,
    warning: colorTokens.warning,
    info: colorTokens.info,
    success: colorTokens.success,
    racing: colorTokens.racing,
    background: {
      default: mode === 'dark' ? colorTokens.surface.main : '#ffffff',
      paper: mode === 'dark' ? colorTokens.surface.container : '#ffffff',
    },
    surface: {
      main: mode === 'dark' ? colorTokens.surface.main : colorTokens.neutral[99],
      variant: mode === 'dark' ? colorTokens.surface.containerHigh : colorTokens.neutral[95],
    },
    outline: {
      main: mode === 'dark' ? colorTokens.neutral[60] : colorTokens.neutral[50],
      variant: mode === 'dark' ? colorTokens.neutral[30] : colorTokens.neutral[80],
    },
    text: {
      primary: mode === 'dark' ? colorTokens.neutral[95] : colorTokens.neutral[10],
      secondary: mode === 'dark' ? colorTokens.neutral[80] : colorTokens.neutral[30],
      disabled: mode === 'dark' ? colorTokens.neutral[60] : colorTokens.neutral[50],
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    // Material Design 3 Typography Scale
    displayLarge: {
      fontSize: '3.5rem',
      fontWeight: 400,
      lineHeight: 1.12,
      letterSpacing: '-0.025em',
    },
    displayMedium: {
      fontSize: '2.8125rem',
      fontWeight: 400,
      lineHeight: 1.16,
      letterSpacing: '0em',
    },
    displaySmall: {
      fontSize: '2.25rem',
      fontWeight: 400,
      lineHeight: 1.22,
      letterSpacing: '0em',
    },
    headlineLarge: {
      fontSize: '2rem',
      fontWeight: 400,
      lineHeight: 1.25,
      letterSpacing: '0em',
    },
    headlineMedium: {
      fontSize: '1.75rem',
      fontWeight: 400,
      lineHeight: 1.29,
      letterSpacing: '0em',
    },
    headlineSmall: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.33,
      letterSpacing: '0em',
    },
    titleLarge: {
      fontSize: '1.375rem',
      fontWeight: 400,
      lineHeight: 1.27,
      letterSpacing: '0em',
    },
    titleMedium: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.009em',
    },
    titleSmall: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.43,
      letterSpacing: '0.007em',
    },
    bodyLarge: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.031em',
    },
    bodyMedium: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.017em',
    },
    bodySmall: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.33,
      letterSpacing: '0.033em',
    },
    labelLarge: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.43,
      letterSpacing: '0.007em',
    },
    labelMedium: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.33,
      letterSpacing: '0.033em',
    },
    labelSmall: {
      fontSize: '0.6875rem',
      fontWeight: 500,
      lineHeight: 1.45,
      letterSpacing: '0.036em',
    },
  },
  shape: {
    borderRadius: 12, // Material Design 3 default border radius
  },
  spacing: 8, // 8px base spacing unit
  shadows: [
    'none',
    // Material Design 3 Elevation Shadows
    '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
    '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
    '0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
    '0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
    ...Array(19).fill('0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'dark' ? `${colorTokens.neutral[60]} ${colorTokens.surface.container}` : `${colorTokens.neutral[40]} ${colorTokens.neutral[95]}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: mode === 'dark' ? colorTokens.surface.container : colorTokens.neutral[95],
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: mode === 'dark' ? colorTokens.neutral[60] : colorTokens.neutral[40],
            minHeight: 24,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20, // Material Design 3 FAB-style buttons
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        },
        elevation2: {
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        },
        elevation3: {
          boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.MuiChip-filled': {
            backgroundColor: mode === 'dark' ? colorTokens.surface.containerHigh : colorTokens.neutral[95],
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: mode === 'dark' ? colorTokens.neutral[60] : colorTokens.neutral[50],
            },
            '&:hover fieldset': {
              borderColor: mode === 'dark' ? colorTokens.neutral[70] : colorTokens.neutral[40],
            },
            '&.Mui-focused fieldset': {
              borderColor: colorTokens.primary.main,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? colorTokens.surface.container : colorTokens.neutral[98],
          color: mode === 'dark' ? colorTokens.neutral[95] : colorTokens.neutral[10],
          boxShadow: 'none',
          borderBottom: `1px solid ${mode === 'dark' ? colorTokens.neutral[30] : colorTokens.neutral[80]}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? colorTokens.surface.container : colorTokens.neutral[98],
          borderRight: `1px solid ${mode === 'dark' ? colorTokens.neutral[30] : colorTokens.neutral[80]}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '0 8px',
          '&.Mui-selected': {
            backgroundColor: alpha(colorTokens.primary.main, 0.12),
            '&:hover': {
              backgroundColor: alpha(colorTokens.primary.main, 0.16),
            },
          },
          '&:hover': {
            backgroundColor: alpha(mode === 'dark' ? colorTokens.neutral[95] : colorTokens.neutral[10], 0.08),
          },
        },
      },
    },
  },
});

// Create theme instances
export const lightTheme = createTheme(createMaterialDesign3Theme('light'));
export const darkTheme = createTheme(createMaterialDesign3Theme('dark'));

// Default theme (light with purple accent)
export const theme = lightTheme;

// Theme context for switching between light and dark modes
export const getTheme = (mode: 'light' | 'dark' = 'light') => 
  mode === 'light' ? lightTheme : darkTheme;

// Export color tokens for custom components
export { colorTokens };

// Extend the Theme interface to include custom properties
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    racing: {
      green: string;
      red: string;
      orange: string;
      yellow: string;
      blue: string;
    };
    surface: {
      main: string;
      variant: string;
    };
    outline: {
      main: string;
      variant: string;
    };
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
    racing?: {
      green?: string;
      red?: string;
      orange?: string;
      yellow?: string;
      blue?: string;
    };
    surface?: {
      main?: string;
      variant?: string;
    };
    outline?: {
      main?: string;
      variant?: string;
    };
  }

  interface TypographyVariants {
    displayLarge: React.CSSProperties;
    displayMedium: React.CSSProperties;
    displaySmall: React.CSSProperties;
    headlineLarge: React.CSSProperties;
    headlineMedium: React.CSSProperties;
    headlineSmall: React.CSSProperties;
    titleLarge: React.CSSProperties;
    titleMedium: React.CSSProperties;
    titleSmall: React.CSSProperties;
    bodyLarge: React.CSSProperties;
    bodyMedium: React.CSSProperties;
    bodySmall: React.CSSProperties;
    labelLarge: React.CSSProperties;
    labelMedium: React.CSSProperties;
    labelSmall: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    displayLarge?: React.CSSProperties;
    displayMedium?: React.CSSProperties;
    displaySmall?: React.CSSProperties;
    headlineLarge?: React.CSSProperties;
    headlineMedium?: React.CSSProperties;
    headlineSmall?: React.CSSProperties;
    titleLarge?: React.CSSProperties;
    titleMedium?: React.CSSProperties;
    titleSmall?: React.CSSProperties;
    bodyLarge?: React.CSSProperties;
    bodyMedium?: React.CSSProperties;
    bodySmall?: React.CSSProperties;
    labelLarge?: React.CSSProperties;
    labelMedium?: React.CSSProperties;
    labelSmall?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    displayLarge: true;
    displayMedium: true;
    displaySmall: true;
    headlineLarge: true;
    headlineMedium: true;
    headlineSmall: true;
    titleLarge: true;
    titleMedium: true;
    titleSmall: true;
    bodyLarge: true;
    bodyMedium: true;
    bodySmall: true;
    labelLarge: true;
    labelMedium: true;
    labelSmall: true;
  }
}