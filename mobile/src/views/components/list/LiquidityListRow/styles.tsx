import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

const iconContainer = {
  backgroundColor: styleguide.colors.gray6(),
  borderRadius: 15,
  width: 30,
  height: 30,
  shadowColor: styleguide.colors.black,
  shadowRadius: 3,
  shadowOffset: { width: 1, height: 1 },
  shadowOpacity: 0.8,
};

export const styles = StyleSheet.create({
  titleStyles: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading4,
    lineHeight: 18,
  },
  leftViewContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 12,
  },
  iconContainerLeft: {
    ...iconContainer,
    zIndex: 2,
  },
  iconContainerRight: {
    ...iconContainer,
    marginLeft: -6,
    zIndex: 1,
  },
  tokenIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  descriptionStyle: {
    ...styleguide.typography.label,
    color: styleguide.colors.textSecondary,
    marginTop: 1,
    marginBottom: 3,
  },
});
