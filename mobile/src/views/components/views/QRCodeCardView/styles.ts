import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  infoCallout: {
    marginTop: 12,
    marginHorizontal: 20,
  },
  cardWrapper: {
    margin: 16,
    marginBottom: 32,
    backgroundColor: styleguide.colors.gray(),
    alignItems: "center",
    padding: 16,
    paddingBottom: 0,
    borderColor: styleguide.colors.gray4(),
    borderRadius: 4,
    borderWidth: 1,
  },
  titleText: {
    color: styleguide.colors.text(),
    ...styleguide.typography.heading3,
    textAlign: "center",
  },
  qrCodeWrapper: {
    margin: 24,
    marginBottom: 16,
    backgroundColor: styleguide.colors.white,
    padding: 10,
    borderRadius: 8,
  },
  addressText: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.caption,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  buttonsWrapper: {
    marginBottom: 28,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
  button: {
    backgroundColor: styleguide.colors.gray6(0.72),
  },
});
