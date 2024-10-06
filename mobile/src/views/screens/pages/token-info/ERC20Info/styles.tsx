import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
  },
  cardWrapper: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  transactionsHeaderText: {
    ...styleguide.typography.label,
    textTransform: "uppercase",
    color: styleguide.colors.text(),
    marginLeft: 4,
    marginBottom: 12,
  },
  transactionsWrapper: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
});
