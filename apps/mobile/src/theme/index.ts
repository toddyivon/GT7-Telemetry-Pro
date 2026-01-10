import { createContext, useContext } from 'react';

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;

  // Text
  text: string;
  textSecondary: string;
  textDisabled: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;

  // Accent colors
  accent: string;
  accentLight: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Telemetry specific
  speed: string;
  rpm: string;
  throttle: string;
  brake: string;
  fuel: string;
  temperature: string;
  bestLap: string;

  // Borders and dividers
  border: string;
  divider: string;

  // Misc
  overlay: string;
  shadow: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    fontSizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    fontWeights: {
      regular: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
}

export const lightColors: ThemeColors = {
  // Backgrounds
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F0F0',
  card: '#FFFFFF',

  // Text
  text: '#333333',
  textSecondary: '#666666',
  textDisabled: '#999999',

  // Primary
  primary: '#1976D2',
  primaryLight: '#42A5F5',
  primaryDark: '#1565C0',
  onPrimary: '#FFFFFF',

  // Accent
  accent: '#FF5722',
  accentLight: '#FF8A65',

  // Status
  success: '#4CAF50',
  successLight: '#81C784',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  error: '#F44336',
  errorLight: '#E57373',
  info: '#2196F3',
  infoLight: '#64B5F6',

  // Telemetry
  speed: '#4CAF50',
  rpm: '#2196F3',
  throttle: '#4CAF50',
  brake: '#F44336',
  fuel: '#9C27B0',
  temperature: '#FF9800',
  bestLap: '#9C27B0',

  // Borders
  border: '#E0E0E0',
  divider: '#EEEEEE',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const darkColors: ThemeColors = {
  // Backgrounds
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2A2A2A',
  card: '#1E1E1E',

  // Text
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textDisabled: '#666666',

  // Primary
  primary: '#42A5F5',
  primaryLight: '#64B5F6',
  primaryDark: '#1E88E5',
  onPrimary: '#000000',

  // Accent
  accent: '#FF7043',
  accentLight: '#FF8A65',

  // Status
  success: '#66BB6A',
  successLight: '#81C784',
  warning: '#FFA726',
  warningLight: '#FFB74D',
  error: '#EF5350',
  errorLight: '#E57373',
  info: '#42A5F5',
  infoLight: '#64B5F6',

  // Telemetry
  speed: '#66BB6A',
  rpm: '#42A5F5',
  throttle: '#66BB6A',
  brake: '#EF5350',
  fuel: '#AB47BC',
  temperature: '#FFA726',
  bestLap: '#AB47BC',

  // Borders
  border: '#333333',
  divider: '#2A2A2A',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    fontSizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    fontWeights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
};

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  ...baseTheme,
};

export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  ...baseTheme,
};

// Theme context
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Utility to create consistent shadows
export const createShadow = (elevation: number, isDark: boolean) => ({
  shadowColor: isDark ? '#000000' : '#000000',
  shadowOffset: {
    width: 0,
    height: elevation,
  },
  shadowOpacity: isDark ? 0.4 : 0.1 + (elevation * 0.02),
  shadowRadius: elevation * 1.5,
  elevation: elevation,
});

// Common style presets
export const createCommonStyles = (theme: Theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...createShadow(2, theme.dark),
  },
  button: {
    primary: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm + 4,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: theme.spacing.sm + 4,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  },
  input: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.text,
  },
  text: {
    title: {
      fontSize: theme.typography.fontSizes.xxl,
      fontWeight: theme.typography.fontWeights.bold,
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.semibold,
      color: theme.colors.text,
    },
    body: {
      fontSize: theme.typography.fontSizes.md,
      color: theme.colors.text,
    },
    caption: {
      fontSize: theme.typography.fontSizes.sm,
      color: theme.colors.textSecondary,
    },
  },
});

export default {
  lightTheme,
  darkTheme,
  ThemeContext,
  useTheme,
  createShadow,
  createCommonStyles,
};
