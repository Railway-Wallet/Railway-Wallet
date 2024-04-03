import { StyleSheet } from 'react-native';
import { styleguide } from '@react-shared';

const ALPHA_HEX = 'B3';

export const styles = StyleSheet.create({
  fullScreenView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  pageWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 265,

    backgroundColor: 'transparent',
  },
  processingWrapper: {
    backgroundColor: styleguide.colors.screenBackground + ALPHA_HEX,
  },
  failWrapper: {
    backgroundColor: styleguide.colors.screenBackground + ALPHA_HEX,
  },
  spinner: {},
  icon: {},
  subtleText: {
    marginTop: 36,
    ...styleguide.typography.caption,
    color: styleguide.colors.labelSecondary,
    marginHorizontal: 36,
    textAlign: 'center',
  },
  boldText: {
    marginTop: 36,
    ...styleguide.typography.heading3,
    color: styleguide.colors.text(),
    marginHorizontal: 36,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 36,
    ...styleguide.typography.heading4,
    color: styleguide.colors.text(),
    marginHorizontal: 36,
    textAlign: 'center',
  },
  warningText: {
    position: 'absolute',
    bottom: 64,
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    marginHorizontal: 36,
    textAlign: 'center',
  },
  progressBarWrapper: {
    marginTop: 48,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {},
});
