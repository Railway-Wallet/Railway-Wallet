import { StyleSheet } from 'react-native';
import { styleguide } from '@react-shared';

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
    padding: 16,
    paddingTop: 64,
  },
  versionsText: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    marginBottom: 20,
  },
  errorMessage: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.text(),
  },
  causedBy: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.textSecondary,
  },
});
