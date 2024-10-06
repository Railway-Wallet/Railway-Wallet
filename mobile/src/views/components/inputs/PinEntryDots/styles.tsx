import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  pinDots: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  pinDotWrapper: {
    width: 36,
    height: 18,
    justifyContent: "center",
  },
  pinDot: {
    alignSelf: "center",
  },
  pinDotSelected: {
    backgroundColor: styleguide.colors.white,
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  pinDotUnselected: {
    backgroundColor: styleguide.colors.gray7(),
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
