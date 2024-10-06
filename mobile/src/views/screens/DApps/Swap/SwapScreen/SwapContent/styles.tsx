import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  headerText: {
    ...styleguide.typography.heading2,
    fontSize: 30,
    fontFamily: "Inconsolata-ExtraBold",
    letterSpacing: 2.4,
    color: styleguide.colors.text(),
    marginHorizontal: 16,
    marginTop: 16,
  },
  thinnerHeader: {
    fontFamily: "Inconsolata",
    fontSize: isAndroid() ? 27 : 30,
  },
  subheaderText: {
    ...styleguide.typography.paragraphSmall,
    color: styleguide.colors.labelSecondary,
    marginHorizontal: 16,
    marginTop: 2,
    paddingBottom: 8,
  },
  errorShowMore: {
    color: styleguide.colors.textSecondary,
  },
  sectionSell: {
    paddingHorizontal: 4,
    marginBottom: 20,
    marginTop: 8,
  },
  sectionBuy: {
    marginTop: 16,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 28,
    borderRadius: 4,
    backgroundColor: styleguide.colors.gray6_50,
    borderColor: styleguide.colors.gray5(),
    borderWidth: 1,
  },
  switchButtonContainer: {
    position: "relative" as "relative",
    zIndex: 5,
  },
  switchButton: {
    position: "absolute" as "absolute",
    left: "50%",
    top: -4,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 4,
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
    backgroundColor: styleguide.colors.gray(),
  },
  infoCallout: {
    marginTop: 20,
  },
  errorText: {
    ...styleguide.typography.caption,
    color: styleguide.colors.error(),
    fontSize: 16,
    paddingLeft: 12,
    paddingRight: 12,
    marginTop: 24,
    marginBottom: 12,
  },
  reviewButton: {
    marginTop: 20,
    marginHorizontal: 4,
  },
});
