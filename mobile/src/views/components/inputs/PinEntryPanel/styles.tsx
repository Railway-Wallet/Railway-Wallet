import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isSmallScreen } from "@services/util/screen-dimensions-service";

const useSmall = isSmallScreen();

export const styles = StyleSheet.create({
  wrapper: {},
  rowWrapper: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonWrapper: {
    marginVertical: useSmall ? 8 : 12,
    marginHorizontal: 12,
  },
  button: {
    borderRadius: useSmall ? 32 : 36,
    alignItems: "center",
  },
  buttonContent: {
    width: useSmall ? 64 : 72,
    height: useSmall ? 64 : 72,
  },
  buttonLabel: {
    ...styleguide.typography.numpadSmall,
  },
  decimalLabel: {
    fontWeight: "400",
  },
});
