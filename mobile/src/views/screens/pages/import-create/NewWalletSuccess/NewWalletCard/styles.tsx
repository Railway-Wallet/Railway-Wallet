import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";

export const CARD_PADDING = 16;

export const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: styleguide.colors.cardSurface,
    borderColor: styleguide.colors.inputBorder,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 24,
    marginHorizontal: 16,
  },
  headerBackground: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeaderText: {
    ...styleguide.typography.heading3,
    color: styleguide.colors.text(),
    marginLeft: 16,
    position: "relative",
    bottom: isAndroid() ? 0 : 1,
  },
  bottomSection: {
    padding: 16,
  },
  addressQrWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: styleguide.colors.gray(),
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
    height: 38,
    width: 38,
    marginLeft: 8,
    marginTop: 4,
  },
  fieldName: {
    ...styleguide.typography.label,
    color: styleguide.colors.gray8(),
    textTransform: "uppercase",
  },
  field: {
    marginTop: 12,
    marginBottom: 24,
    ...styleguide.typography.paragraph,
    color: styleguide.colors.white,
  },
  logoWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  logo: {
    marginTop: 16,
    marginRight: 24,
    height: 32,
    maxWidth: 120,
  },
});
