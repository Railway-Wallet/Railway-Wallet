import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  containerBackground: {
    flexDirection: "column",
    justifyContent: "center",
    backgroundColor: styleguide.colors.gray(0.8),
    height: "100%",
    padding: 16,
  },
  container: {
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
  title: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    marginTop: 16,
    textAlign: "center",
  },
  countdownContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  countdownEst: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    marginRight: 4,
    fontSize: 22,
  },
  countdown: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    fontSize: 22,
    fontWeight: "bold",
  },
  disclaimerText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.text(),
    textAlign: "center",
    marginTop: 26,
  },
  txText: {
    marginTop: 4,
    marginBottom: 26,
    color: styleguide.colors.labelSecondary,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonStyle: {
    width: "48%",
  },
  buttonTextStyle: {
    ...styleguide.typography.label,
    textTransform: "none",
  },
});
