import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  alertBackground: {
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: styleguide.colors.gray(0.8),
    height: "100%",
    padding: 16,
  },
  alertContainer: {
    backgroundColor: styleguide.colors.gray5(),
    shadowColor: styleguide.colors.gray(),
    shadowRadius: 5,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: styleguide.colors.gray9(),
    maxHeight: "80%",
  },
  titleText: {
    ...styleguide.typography.heading4,
    color: styleguide.colors.text(),
    textAlign: "center",
    marginBottom: 16,
  },
  messageText: {
    ...styleguide.typography.paragraphSmall,
    color: styleguide.colors.text(),
    marginBottom: 16,
  },
  submitButtonText: {
    ...styleguide.typography.label,
    textTransform: "none",
  },
  scrollViewContainer: {
    marginBottom: 12,
  },
});
