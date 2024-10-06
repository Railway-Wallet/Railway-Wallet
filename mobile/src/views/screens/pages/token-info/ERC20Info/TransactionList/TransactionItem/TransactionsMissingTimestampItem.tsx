import React from "react";
import { Text, View } from "react-native";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { SavedTransaction, styleguide, useReduxSelector } from "@react-shared";
import {
  callActionSheet,
  OptionWithAction,
} from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { isAndroid } from "@services/util/platform-os-service";
import { styles } from "./styles";

type Props = {
  transactions: SavedTransaction[];
  resyncTransactions: () => Promise<void>;
};

export const TransactionsMissingTimestampItem: React.FC<Props> = ({
  transactions,
  resyncTransactions,
}) => {
  const { wallets } = useReduxSelector("wallets");
  const transactionCount = transactions.length;

  const { showActionSheetWithOptions } = useActionSheet();

  if (!wallets.active) {
    return null;
  }
  if (!transactionCount) {
    return null;
  }

  const showTransactionMenu = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    const options: OptionWithAction[] = [
      {
        name: `Try to re-sync transactions`,
        action: resyncTransactions,
      },
    ];
    callActionSheet(showActionSheetWithOptions, "Options", options);
  };

  const message = `${transactionCount} ${
    transactionCount > 1 ? "transactions needs" : "transaction need"
  } to retrieve timestamps from on-chain data.`;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.statusContainer}>
          <View
            style={{
              ...styles.statusIndicator,
              backgroundColor: styleguide.colors.txRed(),
            }}
          />
          <Text style={styles.statusText}>MISSING DATA</Text>
        </View>
        <ButtonIconOnly
          icon={isAndroid() ? "dots-vertical" : "dots-horizontal"}
          onTap={showTransactionMenu}
          size={24}
          color={styleguide.colors.white}
        />
      </View>
      <Text style={styles.transactionText}>{message}</Text>
    </View>
  );
};
