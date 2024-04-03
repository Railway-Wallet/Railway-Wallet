import { styleguide } from '@react-shared';

export const styles = {
  addressInput: {
    marginTop: 8,
    backgroundColor: styleguide.colors.gray6_50,
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    width: '100%',
  },
  addressInputError: {
    borderBottomColor: styleguide.colors.error(),
  },
  knownWalletContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 6,
  },
  resolvedAddressText: {
    color: styleguide.colors.labelSecondary,
    paddingLeft: 6,
    paddingTop: 6,
    fontSize: 15,
  },
  knownWalletName: {
    color: styleguide.colors.labelSecondary,
    paddingLeft: 6,
    paddingTop: 2,
    fontSize: 15,
  },
  errorText: {
    color: styleguide.colors.error(),
    paddingLeft: 6,
    paddingTop: 6,
    fontSize: 15,
  },
  buttonLabel: {
    ...styleguide.typography.label,
    textTransform: 'none' as 'none',
  },
  inputRightView: {
    display: 'flex',
  },
  inputSpinner: {
    marginRight: 12,
  },
  inputInsetButton: {
    justifyContent: 'center',
    width: 'fit-content',
    height: 32,
  },
};
