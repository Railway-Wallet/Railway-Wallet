import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isSmallScreen } from "@services/util/screen-dimensions-service";

export const styles = StyleSheet.create({
  buttonsWrapper: {
    marginHorizontal: isSmallScreen() ? 24 : 32,
    marginTop: 16,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    backgroundColor: styleguide.colors.gray(0.88),
    marginTop: 6,
    marginHorizontal: 4,
  },
});
