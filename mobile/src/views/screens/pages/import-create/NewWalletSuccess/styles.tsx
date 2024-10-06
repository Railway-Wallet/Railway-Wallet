import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.screenBackground,
    paddingBottom: 16,
  },
  titleText: {
    ...styleguide.typography.paragraphSmall,
    color: styleguide.colors.white,
    textAlign: "center",
    marginTop: 24,
  },
  lastCard: {
    marginBottom: isAndroid() ? 36 : 24,
  },
  scrollViewContentContainer: {
    paddingBottom: isAndroid() ? 50 : 0,
  },
});
