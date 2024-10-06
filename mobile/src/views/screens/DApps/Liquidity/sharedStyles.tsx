import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const sharedStyles = StyleSheet.create({
  item: {
    marginTop: 12,
    borderColor: styleguide.colors.textSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: styleguide.colors.gray6_50,
  },
  selectedTokenContainer: {
    marginTop: 16,
  },
  addTokenButton: {
    marginTop: 24,
    backgroundColor: styleguide.colors.gray6_50,
    borderColor: styleguide.colors.inputBorder,
  },
  addTokenDescription: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    marginTop: 32,
    marginHorizontal: 18,
  },
  infoCalloutReady: {
    marginTop: 24,
  },
  container: {
    flex: 1,
  },
});
