import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    maxWidth: "65%",
    backgroundColor: styleguide.colors.gray5(0.92),
    borderColor: styleguide.colors.gray4(),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },
  text: {
    marginTop: 12,
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.caption,
  },
});
