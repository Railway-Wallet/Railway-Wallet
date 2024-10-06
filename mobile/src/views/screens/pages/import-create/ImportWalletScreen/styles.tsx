import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
  },
  inputsWrapper: {
    marginTop: 40,
    backgroundColor: styleguide.colors.gray6_50,
  },
  bottomInput: {
    borderColor: styleguide.colors.inputBorder,
    borderBottomWidth: 1,
  },
  walletNameInput: {
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
  },
  horizontalLine: {
    height: 1,
    width: "100%",
    marginLeft: 16,
    backgroundColor: styleguide.colors.inputBorder,
  },
  walletInputError: {
    borderBottomColor: styleguide.colors.error(),
  },
  showAdvancedOptions: {
    ...styleguide.typography.actionText,
    color: styleguide.colors.labelSecondary,
    marginTop: 20,
    textAlign: "center",
  },
  walletCreationDateLabel: {
    marginTop: 32,
    marginLeft: 16,
    marginBottom: 14,
    ...styleguide.typography.caption,
    color: styleguide.colors.lighterLabelSecondary,
  },
  derivationContainer: {
    backgroundColor: styleguide.colors.gray6_50,
    borderColor: styleguide.colors.inputBorder,
    borderBottomWidth: 1,
  },
  advanceOptionsContainer: {
    borderColor: styleguide.colors.inputBorder,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 36,
  },
  walletCreationDateContainer: {
    borderColor: styleguide.colors.inputBorder,
    backgroundColor: styleguide.colors.gray6_50,
    borderTopWidth: 1,
  },
  walletCreationDateTitle: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.paragraph,
  },
  walletCreationDateDescription: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.paragraph,
  },
  walletCreationDateDescriptionSelected: {
    color: styleguide.colors.text(),
  },
  warningCallout: {
    marginTop: 16,
  },
});
