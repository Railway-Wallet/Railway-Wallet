import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  scrollView: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  titleRow: {
    alignContent: "flex-start",
    marginTop: 12,
  },
  itemRow: {
    marginTop: 24,
    marginBottom: 16,
  },
  items: {
    marginTop: 12,
    borderColor: styleguide.colors.textSecondary,
    backgroundColor: styleguide.colors.gray6_50,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  hr: {
    backgroundColor: styleguide.colors.textSecondary,
    height: 1,
    width: "100%",
    marginLeft: 16,
  },
  footerText: {
    alignSelf: "center",
    marginTop: 12,
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.caption,
    marginBottom: 32,
  },
  dangerText: {
    color: styleguide.colors.danger,
  },
});
