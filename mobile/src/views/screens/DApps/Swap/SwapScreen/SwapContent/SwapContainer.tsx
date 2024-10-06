import { isDefined } from "@railgun-community/shared-models";
import React, { DependencyList, useEffect, useState } from "react";
import { Text } from "react-native";
import { ButtonTextOnly } from "@components/buttons/ButtonTextOnly/ButtonTextOnly";
import {
  CommonActions,
  NavigationProp,
  StackActions,
} from "@react-navigation/native";
import {
  ERC20Amount,
  ERC20Token,
  SharedConstants,
  TransactionType,
  useReduxSelector,
  useRemoteConfigNetworkError,
  useTopPickSwapERC20s,
  validERC20Amount,
} from "@react-shared";
import { ErrorDetailsModal } from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { useResettableState } from "../../../../../../hooks/extensions/useResettableState";
import { DAppsStackParamList } from "../../../../../../models/navigation-models";
import {
  HapticSurface,
  triggerHaptic,
} from "../../../../../../services/util/haptic-service";
import {
  SwapSettings,
  SwapSettingsModal,
} from "../../SwapSettingsModal/SwapSettingsModal";
import { SwapContentProps } from "./SharedSwapContent";
import { ZeroXPrivateSwapContent } from "./ZeroXPrivateSwapContent";
import { ZeroXPublicSwapContent } from "./ZeroXPublicSwapContent";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "Swap">;
  navigationToken: Optional<ERC20Token>;
  isRailgun: boolean;
};

export const SwapContainer: React.FC<Props> = ({
  navigation,
  navigationToken,
  isRailgun,
}: Props) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [resetCount, setResetCount] = useState(0);
  const resetDeps: DependencyList = [network, navigationToken, resetCount];

  const { topPickSellToken, topPickBuyToken } = useTopPickSwapERC20s(
    isRailgun,
    navigationToken
  );

  const [currentSellERC20, setCurrentSellERC20] = useResettableState<
    Optional<ERC20Token>
  >(topPickSellToken, resetDeps);
  const [currentBuyERC20, setCurrentBuyERC20] = useResettableState<
    Optional<ERC20Token>
  >(topPickBuyToken, resetDeps);

  const [sellTokenEntryString, setSellTokenEntryString] = useResettableState(
    "",
    resetDeps
  );

  const [showAmountEntry, setShowAmountEntry] = useResettableState(
    true,
    resetDeps
  );
  const [hasValidSellAmount, setHasValidSellAmount] = useResettableState(
    false,
    resetDeps
  );

  const [showSwapSettings, setShowSwapSettings] = useResettableState(
    false,
    resetDeps
  );
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useResettableState(
    false,
    resetDeps
  );

  const [slippagePercentageOverride, setSlippagePercentageOverride] =
    useResettableState<Optional<number>>(undefined, resetDeps);
  const defaultSlippagePercentage = isRailgun
    ? SharedConstants.DEFAULT_SLIPPAGE_PRIVATE_TXS
    : SharedConstants.DEFAULT_SLIPPAGE_PUBLIC_TXS;
  const swapSettings: SwapSettings = {
    slippagePercentage: slippagePercentageOverride ?? defaultSlippagePercentage,
  };
  const onDismissSwapSettings = (newSettings?: SwapSettings) => {
    if (newSettings) {
      if (newSettings.slippagePercentage !== swapSettings.slippagePercentage) {
        setSlippagePercentageOverride(newSettings.slippagePercentage);
      }
      triggerHaptic(HapticSurface.EditSuccess);
    }
    setShowSwapSettings(false);
  };

  useEffect(() => {
    setCurrentSellERC20(topPickSellToken);
    setCurrentBuyERC20(topPickBuyToken);
    setSellTokenEntryString("");
    setShowAmountEntry(true);
    setHasValidSellAmount(false);
    setShowSwapSettings(false);
    setSlippagePercentageOverride(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, navigationToken]);

  let validSellERC20Amount: Optional<ERC20Amount> = validERC20Amount(
    sellTokenEntryString,
    currentSellERC20
  );
  if (
    validSellERC20Amount &&
    BigInt(validSellERC20Amount.amountString) === 0n
  ) {
    validSellERC20Amount = undefined;
  }

  const activeWallet = wallets.active;

  const activeWalletError = !activeWallet
    ? new Error("Please connect a wallet.")
    : undefined;

  const { remoteConfigNetworkError } = useRemoteConfigNetworkError(
    TransactionType.Swap,
    isRailgun,
    isRailgun
  );

  const returnBackFromCompletedOrder = () => {
    navigation.dispatch(StackActions.pop(1));
    navigation.dispatch(CommonActions.navigate("WalletsScreen"));
    setResetCount(resetCount + 1);
  };

  const error = activeWalletError ?? remoteConfigNetworkError;

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  const swapContentParams: SwapContentProps = {
    navigation,
    sellERC20: currentSellERC20,
    sellERC20Amount: validSellERC20Amount,
    buyERC20: currentBuyERC20,
    showAmountEntry,
    setShowAmountEntry,
    hasValidSellAmount,
    setHasValidSellAmount,
    swapSettings,
    setShowSwapSettings,
    sellTokenEntryString,
    setCurrentSellERC20,
    setCurrentBuyERC20,
    setSellTokenEntryString,
    returnBackFromCompletedOrder,
  };

  return (
    <>
      {showSwapSettings && (
        <SwapSettingsModal
          show={showSwapSettings}
          isRailgun={isRailgun}
          currentSettings={swapSettings}
          onDismiss={onDismissSwapSettings}
        />
      )}
      {isDefined(error) && (
        <>
          <Text style={styles.errorText}>{error.message}</Text>
          <ButtonTextOnly title="Show more" onTap={openErrorDetailsModal} />
        </>
      )}
      {isDefined(error) && (
        <ErrorDetailsModal
          error={error}
          show={showErrorDetailsModal}
          onDismiss={dismissErrorDetailsModal}
        />
      )}
      {!isDefined(error) &&
        (isRailgun ? (
          <ZeroXPrivateSwapContent {...swapContentParams} />
        ) : (
          <ZeroXPublicSwapContent {...swapContentParams} />
        ))}
    </>
  );
};
