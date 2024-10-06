import { StyleSheet } from "react-native";
import { isAndroid } from "@services/util/platform-os-service";

export const SWIRL_DEFAULT_WIDTH_PCT = 54;

export const styles = StyleSheet.create({
  swirl: {
    position: "absolute",
    width: `${SWIRL_DEFAULT_WIDTH_PCT}%`,
    height: 75,
    left: "-4%",
    top: isAndroid() ? 8 : 55,
    overflow: "visible",

    opacity: 1.0,
  },
});
