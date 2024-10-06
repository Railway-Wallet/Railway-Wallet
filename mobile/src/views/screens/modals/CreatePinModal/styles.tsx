import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isSmallScreen } from "@services/util/screen-dimensions-service";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
    padding: 16,
    paddingTop: 64,
  },
  swirlBackground: {
    left: 0,
    top: 36,
  },
  pinTitleDotsWrapper: {
    marginTop: "30%",
    alignItems: "center",
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
  titleText: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    textTransform: "uppercase",
  },
  noticeTextWrapper: {
    marginTop: isSmallScreen() ? 4 : 16,
    paddingHorizontal: 48,
    minHeight: 32,
    justifyContent: "center",
  },
  noticeText: {
    ...styleguide.typography.label,
    color: styleguide.colors.text(),
    alignSelf: "center",
    textAlign: "center",
  },
  errorText: {
    ...styleguide.typography.label,
    color: styleguide.colors.error(),
    alignSelf: "center",
    textAlign: "center",
  },
  pinEntryPanelWrapper: {
    marginTop: isSmallScreen() ? 4 : 16,
  },
  bottomButtons: {
    marginTop: isSmallScreen() ? 16 : 26,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  bottomButton: {
    width: "100%",
  },
  bottomButtonLabel: {
    ...styleguide.typography.label,
    textTransform: "none",
  },
});
