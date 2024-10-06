import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.gray5(),
    padding: 20,
  },
  text: {
    color: styleguide.colors.text(),
    ...styleguide.typography.caption,
  },
  title: {
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    marginBottom: 20,
  },
  progressBarWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  warningText: {
    color: styleguide.colors.text(),
    ...styleguide.typography.caption,
    textAlign: "center",
    marginVertical: 20,
  },
  errorText: {
    textAlign: "center",
    marginBottom: 10,
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
  copyContainer: {
    backgroundColor: styleguide.colors.gray3(),
    borderRadius: 5,
    padding: 10,
    paddingRight: 50,
    gap: 8,
    borderWidth: 1,
    borderColor: styleguide.colors.gray2(),
    position: "relative",
  },
  copyButtonContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 5,
    backgroundColor: styleguide.colors.gray2(),
    alignSelf: "flex-end",
    padding: 5,
  },
  loadingContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tryAgain: {
    marginBottom: 20,
  },
});
