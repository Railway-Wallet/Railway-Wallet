import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  tokenList: {
    padding: 16,
  },
  tokenListContentContainer: {
    paddingBottom: 30,
  },
  rightBalances: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 10,
    maxWidth: 150,
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading4,
    textAlign: "right",
  },
  errorStyle: {
    textAlign: "right",
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.label,
  },
  placeholder: {
    paddingHorizontal: 32,
    marginTop: "20%",
    textAlign: "center",
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.label,
  },
});
