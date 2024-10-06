import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";
import { isSmallScreen } from "@services/util/screen-dimensions-service";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  scrollView: {
    height: "100%",
  },
  contentWrapper: {
    padding: 8,
  },
  buttonWrapper: {
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row-reverse",
    height: 48,
  },
  buttonStyle: {
    backgroundColor: styleguide.colors.gray6_50,
    borderColor: styleguide.colors.buttonBorder,
    borderWidth: 1,
  },
  buttonText: {
    ...styleguide.typography.caption,
    textTransform: "none",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  listHeaderTextWrapper: {
    flexDirection: "row",
  },
  listHeaderText: {
    textTransform: "uppercase",
    color: styleguide.colors.text(),
    ...styleguide.typography.label,
  },
  listHeaderIcon: {
    paddingLeft: 8,
    paddingTop: 2,
  },
  rightBalances: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading4,
    lineHeight: 18,
    ...(isAndroid() && isSmallScreen() && { fontSize: 16 }),
  },
  descriptionStyle: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.label,
    marginTop: 1,
    marginBottom: 3,
  },
  spinnerContainer: {
    marginTop: 32,
    alignSelf: "center",
    marginRight: 12,
  },
  placeholderText: {
    ...styleguide.typography.paragraphSmall,
    color: styleguide.colors.labelSecondary,
    marginTop: 16,
  },
  farmSourcesWrapper: {
    marginTop: 24,
  },
  horizontalLine: {
    height: 1,
    width: "100%",
    marginRight: 36,
    backgroundColor: styleguide.colors.inputBorder,
  },
  farmSourcesListText: {
    ...styleguide.typography.paragraphSmall,
    color: styleguide.colors.textSecondary,
    marginTop: 24,
  },
  farmSourcesListWrapper: {
    display: "flex",
    marginTop: 16,
  },
  farmSourceButton: {
    marginTop: 8,
  },
  farmSourcesListButtonText: {
    textTransform: "none",
  },
});
