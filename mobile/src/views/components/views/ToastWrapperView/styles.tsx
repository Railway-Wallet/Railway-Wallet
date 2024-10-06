import { StyleSheet } from "react-native";
import { isAndroid } from "@services/util/platform-os-service";

export const styles = StyleSheet.create({
  toastsWrapper: {
    position: "absolute",
    bottom: isAndroid() ? 52 : 88,
    left: 0,
    right: 0,
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
