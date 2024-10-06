import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isTightWidth } from "@services/util/screen-dimensions-service";

export const styles = StyleSheet.create({
  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 8,
    marginTop: 24,
    height: 52,
    width: "100%",
    overflow: "hidden",
  },
  footerRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  footerIconText: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignContent: "center",
    paddingLeft: 4,
    flexGrow: 1,
  },
  footerIcon: {
    maxWidth: 20,
    maxHeight: 22,
    marginRight: 12,
    overflow: "visible",
    alignSelf: "center",
  },
  footerText: {
    ...styleguide.typography.caption,
    alignSelf: "center",
    maxWidth: isTightWidth() ? 108 : 128,
    lineHeight: 16,
    fontSize: 14,
  },
});
