import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  tabWrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
  },
  scrollView: {
    height: "100%",
  },
  titleRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 12,
  },
});
