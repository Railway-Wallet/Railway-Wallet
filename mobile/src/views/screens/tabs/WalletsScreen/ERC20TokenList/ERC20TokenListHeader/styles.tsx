import { StyleSheet } from 'react-native';
import { styleguide } from '@react-shared';

export const styles = StyleSheet.create({
  addButton: {
    justifyContent: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    ...styleguide.typography.button,
    backgroundColor: styleguide.colors.gray6_50,
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
    borderRadius: 4,
    height: 48,
    width: 48,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
});
