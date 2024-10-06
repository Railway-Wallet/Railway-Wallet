import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.gray5(),
  },
  content: {
    marginTop: 12,
  },
  spacer: {
    height: 24,
    width: "100%",
  },
  submitButton: {
    marginHorizontal: 16,
  },
  errorText: {
    ...styleguide.typography.labelSmall,
    color: styleguide.colors.error(),
    paddingHorizontal: 20,
  },
  disclaimerText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.textSecondary,
    marginTop: 24,
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
});
