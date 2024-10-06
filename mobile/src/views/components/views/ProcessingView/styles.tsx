import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isSmallScreen } from "@services/util/screen-dimensions-service";

const useSmall = isSmallScreen();

const ALPHA_HEX = "B3";

export const styles = StyleSheet.create({
  fullScreenView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  pageWrapper: {
    flex: 1,
    alignItems: "center",
    paddingTop: useSmall ? 60 : 180,
    backgroundColor: styleguide.colors.screenBackground + ALPHA_HEX,
  },
  loading: {
    height: 160,
  },
  subtleText: {
    marginTop: 36,
    ...styleguide.typography.caption,
    color: styleguide.colors.labelSecondary,
    marginHorizontal: 36,
    textAlign: "center",
  },
  boldText: {
    marginTop: 36,
    color: styleguide.colors.text(),
    fontSize: 18,
    marginHorizontal: 36,
    textAlign: "center",
  },
  warningText: {
    position: "absolute",
    bottom: 64,
    ...styleguide.typography.paragraph,
    color: styleguide.colors.text(),
    marginHorizontal: 36,
    textAlign: "center",
    alignSelf: "center",
  },
  progressBarWrapper: {
    marginTop: 48,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  animation: {
    height: 160,
    position: "absolute",
  },
  animationsContainer: {
    marginTop: 12,
    position: "relative",
    alignItems: "center",
  },
  informationContainer: {
    width: "100%",
    height: "100%",
    flex: 1,
  },
});
