import { StyleSheet } from 'react-native';
import { styleguide } from '@react-shared';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  swirlBackground: {
    left: 0,
    top: 36,
  },
  textWrapper: {
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 24,
    top: '30%',
  },
  errorShowMore: {
    marginTop: 12,
    color: styleguide.colors.textSecondary,
  },
  errorText: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    marginBottom: 32,
  },
  loadingText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  progressBarWrapper: {
    marginTop: 32,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {},
  retryContainer: {
    marginBottom: 16,
  },
  button: {
    marginLeft: 8,
    marginRight: 8,
  },
});
