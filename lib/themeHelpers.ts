import { colors, fonts, spacing, borderRadius, typography, common } from './styles';

// Typography helpers
export const text = {
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  h4: typography.h4,
  body: typography.body,
  bodySmall: typography.bodySmall,
  bodyLarge: typography.bodyLarge,
  label: typography.label,
  labelSmall: typography.labelSmall,
  caption: typography.caption,
  button: typography.button,
  buttonSmall: typography.buttonSmall,
  buttonLarge: typography.buttonLarge,
};

// Layout helpers
export const layout = {
  container: common.container,
  content: common.content,
  card: common.card,
  header: common.header,
  headerTitle: common.headerTitle,
  headerSubtitle: common.headerSubtitle,
  loadingContainer: common.loadingContainer,
  loadingText: common.loadingText,
  errorContainer: common.errorContainer,
  errorText: common.errorText,
  errorSubtext: common.errorSubtext,
  emptyContainer: common.emptyContainer,
  emptyText: common.emptyText,
  emptySubtext: common.emptySubtext,
};

// Component helpers
export const components = {
  button: common.button,
  buttonSecondary: common.buttonSecondary,
  buttonOutline: common.buttonOutline,
  input: common.input,
  inputFocused: common.inputFocused,
};

// Quick access to design tokens
export { colors, fonts, spacing, borderRadius };