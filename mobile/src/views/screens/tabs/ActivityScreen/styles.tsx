import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  scrollView: {
    height: "100%",
    backgroundColor: styleguide.colors.black,
  },
  refreshControl: {
    color: "white",
  },
  titleRow: {
    alignContent: "flex-start",
    marginTop: 12,
  },
  transactionsHeaderText: {
    ...styleguide.typography.label,
    textTransform: "uppercase",
    color: styleguide.colors.text(),
    marginLeft: 4,
    marginBottom: 12,
  },
  transactionsWrapper: {
    marginTop: 32,
    paddingHorizontal: 16,
    marginBottom: 24,
    display: "flex",
  },
  transactionsHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  spinner: {
    marginRight: 16,
  },
});
