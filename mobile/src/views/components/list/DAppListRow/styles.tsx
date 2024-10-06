import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  rowWrapper: {
    marginHorizontal: 16,
  },
  centerStyle: {
    maxWidth: "100%",
    flex: 1,
  },
  selectedWrapper: {
    backgroundColor: styleguide.colors.gray5(),
    borderColor: styleguide.colors.txGreen(),
  },
  disabledWrapper: {
    opacity: 0.3,
  },
  listItem: {
    height: 68,
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading3,
  },
  descriptionStyle: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.label,
  },
  dAppIconWrapper: {
    display: "flex",
    justifyContent: "center",
    paddingLeft: 6,
    paddingRight: 8,
  },
  dAppIconBackground: {
    width: 48,
    height: 48,
    backgroundColor: styleguide.colors.gray5(0.6),
    borderRadius: 6,
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "solid",
    alignItems: "center",
    borderColor: styleguide.colors.buttonBorder,
  },
  dAppImage: {
    width: 32,
    height: 32,
    padding: 4,
    alignSelf: "center",
    marginHorizontal: 12,
    borderRadius: 15,
    backgroundColor: styleguide.colors.gray5(),
  },
});
