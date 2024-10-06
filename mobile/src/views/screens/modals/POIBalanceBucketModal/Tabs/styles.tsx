import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  poiTabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 60,
  },
  poiTab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderBottomColor: styleguide.colors.gray3(),
    borderBottomWidth: 1,
  },
  poiTabSelected: {
    borderBottomColor: "white",
  },
  poiTabText: {
    textAlign: "center",
    ...styleguide.typography.label,
    color: styleguide.colors.gray3(),
  },
  poiTextSelected: {
    color: "white",
  },
});
