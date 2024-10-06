import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Modal, Text, View } from "react-native";
import { SafeGrayFooter } from "@components/footers/SafeGrayFooter/SafeGrayFooter";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderIconButton } from "@components/headers/headerSideComponents/HeaderIconButton/HeaderIconButton";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import {
  ERC20Token,
  SelectTokenPurpose,
  styleguide,
  tokenBalancesForWalletAndState,
  TransactionType,
  useReduxSelector,
  useSelectableTokens,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { SelectERC20List } from "./SelectERC20List/SelectERC20List";
import { styles } from "./styles";

type Props = {
  show: boolean;
  headerTitle: string;
  skipBaseToken: boolean;
  onDismiss: (token?: ERC20Token, shouldOpenAddTokens?: boolean) => void;
  isRailgun: boolean;
  purpose: SelectTokenPurpose;
  transactionType: TransactionType | null;
  hasExistingTokenAmounts?: boolean;
  showAddTokensButton?: boolean;
  useRelayAdaptForBroadcasterFee: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const SelectERC20Modal: React.FC<Props> = ({
  show,
  onDismiss,
  isRailgun,
  headerTitle,
  skipBaseToken,
  purpose,
  transactionType,
  hasExistingTokenAmounts = false,
  showAddTokensButton = false,
  useRelayAdaptForBroadcasterFee,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { txidVersion } = useReduxSelector("txidVersion");

  const currentTxidVersion = txidVersion.current;

  const [
    broadcasterFeeRefreshButtonCount,
    setBroadcasterFeeRefreshButtonCount,
  ] = useState(0);

  const activeWallet = wallets.active;

  const { addedTokens } = useSelectableTokens(
    purpose,
    transactionType,
    skipBaseToken,
    hasExistingTokenAmounts
  );

  if (!addedTokens.length) {
    return null;
  }

  const ERC20BalancesSerialized = tokenBalancesForWalletAndState(
    activeWallet,
    erc20BalancesNetwork.forNetwork[network.current.name],
    erc20BalancesRailgun.forNetwork[network.current.name],
    isRailgun,
    currentTxidVersion,
    balanceBucketFilter
  );

  const addNewTokens = () => {
    triggerHaptic(HapticSurface.SelectItem);
    const shouldOpenAddTokens = true;
    onDismiss(undefined, shouldOpenAddTokens);
  };

  const refreshBroadcasterFeeTokens = () => {
    setBroadcasterFeeRefreshButtonCount(broadcasterFeeRefreshButtonCount + 1);
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="formSheet"
      visible={show}
      onRequestClose={() => {
        onDismiss();
      }}
    >
      <AppHeader
        title={headerTitle}
        headerStatusBarHeight={16}
        backgroundColor={styleguide.colors.gray5()}
        isModal
        headerLeft={
          <HeaderTextButton
            text="Cancel"
            onPress={() => {
              onDismiss();
            }}
          />
        }
        headerRight={
          purpose === SelectTokenPurpose.BroadcasterFee ? (
            <HeaderIconButton
              icon="refresh"
              onPress={refreshBroadcasterFeeTokens}
            />
          ) : undefined
        }
      />
      <View style={styles.wrapper}>
        <SelectERC20List
          addedTokens={addedTokens}
          ERC20BalancesSerialized={ERC20BalancesSerialized}
          isRailgun={isRailgun}
          wallet={activeWallet}
          onSelect={(token: ERC20Token) => onDismiss(token)}
          purpose={purpose}
          useRelayAdaptForBroadcasterFee={useRelayAdaptForBroadcasterFee}
          broadcasterFeeRefreshButtonCount={broadcasterFeeRefreshButtonCount}
        />
        <SafeGrayFooter>
          <View style={styles.footerContent}>
            <Text style={styles.footerText}>
              Showing tokens added to wallet: {activeWallet?.name ?? "Unknown"}.
            </Text>
            {showAddTokensButton && (
              <Text onPress={addNewTokens} style={styles.footerTextButton}>
                Add new tokens?
              </Text>
            )}
          </View>
        </SafeGrayFooter>
      </View>
    </Modal>
  );
};
