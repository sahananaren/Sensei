import { StyleSheet } from 'react-native';

// ===== DESIGN TOKENS =====

// Colors
export const colors = {
  // Primary colors
  primary: '#329BA4',
  primaryLight: '#4AB3BC',
  primaryDark: '#2A8A92',
  
  // Secondary colors
  secondary: '#A7A7A7',
  secondaryLight: '#C4C4C4',
  secondaryDark: '#8A8A8A',
  
  // Background colors
  background: '#0A0A0A',
  surface: '#111111',
  surfaceLight: '#1C1C1C',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A7A7A7',
  textMuted: '#666666',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#C04B76',
  errorLight: '#E57373',
  
  // Vision colors (for color picker)
  visionColors: ['#329BA4', '#5E85E7', '#C04B76', '#E7975E'],
  
  // Transparent colors
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.7)',
} as const;

// Typography
export const fonts = {
  // Font families
  primary: 'Inter',
  primaryBold: 'Inter-Bold',
  primarySemiBold: 'Inter-SemiBold',
  primaryRegular: 'Inter-Regular',
  
  // Font sizes
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  
  // Font weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
} as const;

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// ===== TYPOGRAPHY STYLES =====

export const typography = StyleSheet.create({
  // Headings
  h1: {
    fontSize: fonts['3xl'],
    fontWeight: fonts.bold,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: fonts.xl,
    fontWeight: fonts.semibold,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  h4: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  
  // Body text
  body: {
    fontSize: fonts.base,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: fonts.sm,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
  bodyLarge: {
    fontSize: fonts.lg,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  
  // Labels
  label: {
    fontSize: fonts.base,
    fontWeight: fonts.medium,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  labelSmall: {
    fontSize: fonts.sm,
    fontWeight: fonts.medium,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
  
  // Captions
  caption: {
    fontSize: fonts.xs,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textMuted,
  },
  
  // Buttons
  button: {
    fontSize: fonts.base,
    fontWeight: fonts.semibold,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  buttonSmall: {
    fontSize: fonts.sm,
    fontWeight: fonts.semibold,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
  buttonLarge: {
    fontSize: fonts.lg,
    fontWeight: fonts.semibold,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
  },
});

// ===== COMMON STYLES =====

export const common = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  
  // Buttons
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Inputs
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fonts.base,
    fontFamily: fonts.primary,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  
  // Headers
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fonts['2xl'],
    fontWeight: fonts.bold,
    fontFamily: fonts.primary,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: fonts.base,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fonts.base,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
  },
  
  // Error states
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  errorText: {
    fontSize: fonts.lg,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.error,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorSubtext: {
    fontSize: fonts.base,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  
  // Empty states
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: fonts.lg,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptySubtext: {
    fontSize: fonts.base,
    fontWeight: fonts.normal,
    fontFamily: fonts.primary,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

// ===== UTILITY FUNCTIONS =====

export const getFontFamily = (weight: keyof typeof fonts = 'primary') => {
  return fonts[weight];
};

export const getColor = (colorKey: keyof typeof colors) => {
  return colors[colorKey];
};

export const getSpacing = (size: keyof typeof spacing) => {
  return spacing[size];
};

export const getBorderRadius = (size: keyof typeof borderRadius) => {
  return borderRadius[size];
};

// ===== THEME EXPORT =====

export const theme = {
  colors,
  fonts,
  spacing,
  borderRadius,
  shadows,
  typography,
  common,
} as const;

export default theme; 