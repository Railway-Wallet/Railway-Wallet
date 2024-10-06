import { StyleSheet } from "react-native";
import { styleguide } from "@react-shared";

export const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "column",
    width: "100%",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    backgroundColor: styleguide.colors.gray6(),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: styleguide.colors.gray5(),
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    height: 24,
    flexDirection: "row",
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIndicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusText: {
    color: styleguide.colors.white,
    ...styleguide.typography.labelSmall,
  },
  transactionText: {
    color: styleguide.colors.text(),
    ...styleguide.typography.caption,
    marginBottom: 4,
  },
  memoText: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.caption,
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 20,
  },
  failedErrorText: {
    color: styleguide.colors.text(),
    ...styleguide.typography.caption,
    marginBottom: 4,
  },
  footerWrapper: {
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  footerText: {
    color: styleguide.colors.labelSecondary,
    ...styleguide.typography.caption,
  },
  poiStatusTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6,
    marginBottom: 3,
  },
  feeText: {
    color: styleguide.colors.textSecondary,
    ...styleguide.typography.caption,
    marginBottom: 4,
  },
  amountStyle: {
    color: styleguide.colors.white,
    ...styleguide.typography.heading3,
  },
});
