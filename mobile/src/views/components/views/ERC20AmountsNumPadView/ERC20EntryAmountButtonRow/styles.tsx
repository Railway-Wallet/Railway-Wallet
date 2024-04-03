import { StyleSheet } from 'react-native';
import { styleguide } from '@react-shared';

export const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  titleWrapper: {
    borderColor: styleguide.colors.textSecondary,
    borderBottomWidth: 1,
    marginHorizontal: 12,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 160,
  },
  focusedBorder: {
    borderColor: styleguide.colors.white,
  },
  title: {
    ...styleguide.typography.heading2,
    fontSize: 28,
    color: styleguide.colors.text(),
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 3,
  },
  placeholderTitle: {
    color: styleguide.colors.textSecondary,
  },
  placeholderTitleFocused: {
    color: styleguide.colors.labelSecondary,
  },
  errorTitleBorder: {
    borderColor: styleguide.colors.error(),
  },
  toastStyle: {
    top: -28,
    left: 75,
  },
});
