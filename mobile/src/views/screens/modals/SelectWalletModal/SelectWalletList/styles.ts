import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  container: {
    paddingBottom: 50,
  },
  tokenList: {
    padding: 16,
  },
  tokenListContentContainer: {
    paddingBottom: 30,
  },
  rightBalances: {
    display: "flex",
    flexDirection: "column" as "column",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
  },
  titleStyle: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading4,
    textAlign: "right" as "right",
  },
  descriptionContainer: {
    display: "flex",
  },
  descriptionStyle: {
    marginTop: 0,
  },
  descriptionTextStyle: {
    marginTop: 5,
    color: styleguide.colors.lighterLabelSecondary,
    ...styleguide.typography.labelSmall,
  },
  leftIconView: {
    justifyContent: "center",
    marginHorizontal: 8,
  },
  rightTextStyle: {
    marginTop: 4,
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.caption,
  },
  placeholder: {
    paddingLeft: 32,
    paddingRight: 32,
    marginTop: "20%",
    textAlign: "center" as "center",
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.label,
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    height: "100%",
    paddingLeft: 4,
    paddingRight: 20,
  },
  rowIcon: {
    width: 30,
    height: 30,
    alignSelf: "center",
    marginHorizontal: 12,
    borderRadius: 15,
  },
});
