import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";
import { isSmallScreen } from "@services/util/screen-dimensions-service";

export const styles = StyleSheet.create({
  rowWrapper: {
    marginTop: 8,
    backgroundColor: styleguide.colors.gray(),
    borderRadius: 4,
    borderColor: styleguide.colors.gray5(),
    borderWidth: 1,
  },
  listItem: {
    height: 72,
  },
  rightBalances: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading3,
    letterSpacing: 0.5,
    ...(isAndroid() && isSmallScreen() && { fontSize: 16 }),
  },
  titleCurrencyStyle: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.heading4,
    ...(isAndroid() && isSmallScreen() && { fontSize: 14 }),
    letterSpacing: 3,
  },
  descriptionStyle: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.label,
    marginTop: 1,
    marginBottom: 3,
  },
  tokenIcon: {
    maxWidth: 32,
    maxHeight: 32,
    alignSelf: "center",
    marginHorizontal: 12,
  },

  leftDescription: {
    marginTop: 6,
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.caption,
  },
  secondLineLeftDescription: {
    color: styleguide.colors.inputBorder,
  },
});
