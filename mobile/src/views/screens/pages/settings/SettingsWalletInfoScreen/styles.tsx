import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";
import { isAndroid } from "@services/util/platform-os-service";

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: styleguide.colors.black,
  },
  itemRow: {
    marginTop: 24,
    marginBottom: 8,
  },
  items: {
    marginTop: 12,
    borderColor: styleguide.colors.textSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: styleguide.colors.gray6_50,
  },
  hr: {
    backgroundColor: styleguide.colors.textSecondary,
    height: 1,
    width: "100%",
    marginLeft: 16,
  },
  backupWarningText: {
    marginTop: 12,
    marginHorizontal: 16,
    ...styleguide.typography.caption,
    color: styleguide.colors.labelSecondary,
  },
  walletInfoTextEntry: {
    paddingBottom: isAndroid() ? 0 : 12,
  },
});
