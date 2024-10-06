import { SwapQuoteData } from "@railgun-community/cookbook";
import { isDefined } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { WideButtonTextOnly } from "@components/buttons/WideButtonTextOnly/WideButtonTextOnly";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { DAppsStackParamList } from "@models/navigation-models";
import { CommonActions, NavigationProp } from "@react-navigation/native";
import {
  CalloutType,
  compareTokens,
  ERC20Amount,
  ERC20Token,
  formatUnitFromHexString,
  isRebaseToken,
  maxBigIntForTransaction,
  styleguide,
  TransactionType,
  useReduxSelector,
  useRelayAdaptPrivateNotice,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { ErrorDetailsModal } from "@views/screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { SwapSettings } from "../../SwapSettingsModal/SwapSettingsModal";
import { SwapBuyERC20Amount } from "../SwapBuyERC20Amount/SwapBuyERC20Amount";
import { SwapSellTokenAmountEntry } from "../SwapSellTokenAmountEntry/SwapSellTokenAmountEntry";
import { styles } from "./styles";

export type SwapContentProps = {
  navigation: NavigationProp<DAppsStackParamList, "Swap">;
  sellERC20: Optional<ERC20Token>;
  sellERC20Amount: Optional<ERC20Amount>;
  buyERC20: Optional<ERC20Token>;
  showAmountEntry: boolean;
  setShowAmountEntry: (show: boolean) => void;
  hasValidSellAmount: boolean;
  setHasValidSellAmount: (hasValidSellAmount: boolean) => void;
  sellTokenEntryString: string;
  swapSettings: SwapSettings;
  setShowSwapSettings: (showSwapSettings: boolean) => void;
  setCurrentSellERC20: (token: Optional<ERC20Token>) => void;
  setCurrentBuyERC20: (token: Optional<ERC20Token>) => void;
  setSellTokenEntryString: (value: string) => void;
  returnBackFromCompletedOrder: () => void;
};

type Props = SwapContentProps & {
  isRailgun: boolean;
  quote: Optional<SwapQuoteData>;
  quoteError: Optional<Error>;
  buyERC20Amount: Optional<ERC20Amount>;
  isLoadingQuote: boolean;
  onTapReviewOrder: () => void;
};

export const SharedSwapContent: React.FC<Props> = ({
  navigation,
  isRailgun,
  quote,
  quoteError,
  isLoadingQuote,
  sellERC20,
  sellERC20Amount,
  buyERC20,
  buyERC20Amount,
  sellTokenEntryString,
  showAmountEntry,
  setShowAmountEntry,
  hasValidSellAmount,
  setHasValidSellAmount,
  setShowSwapSettings,
  setCurrentSellERC20,
  setCurrentBuyERC20,
  setSellTokenEntryString,
  onTapReviewOrder,
}) => {
  const { network } = useReduxSelector("network");
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  const onSelectTokenAmount = (tokenAmount: ERC20Amount) => {
    triggerHaptic(HapticSurface.SelectItem);
    setSellTokenEntryString(
      formatUnitFromHexString(
        tokenAmount.amountString,
        tokenAmount.token.decimals
      )
    );
    setShowAmountEntry(true);
  };

  const switchBuyAndSell = () => {
    const tempSellToken = sellERC20;
    setCurrentSellERC20(buyERC20);
    setCurrentBuyERC20(tempSellToken);
    triggerHaptic(HapticSurface.EditSuccess);
  };

  const updateSellToken = (token: ERC20Token) => {
    const originalSellToken = sellERC20;
    setCurrentSellERC20(token);
    if (originalSellToken && compareTokens(token, buyERC20)) {
      setCurrentBuyERC20(originalSellToken);
    }
  };

  const updateBuyERC20 = (token: ERC20Token) => {
    const originalBuyToken = buyERC20;
    setCurrentBuyERC20(token);
    if (originalBuyToken && compareTokens(token, sellERC20)) {
      setCurrentSellERC20(originalBuyToken);
    }
  };

  const onApproveSuccessCallback = () => {
    navigation.dispatch(CommonActions.navigate("Swap", {}));
  };

  const openApprove = (sellToken: ERC20Token) => {
    if (!isDefined(sellToken) || !quote || !isDefined(quote.spender)) {
      return;
    }
    triggerHaptic(HapticSurface.NavigationButton);

    navigation.navigate("ApproveTokenConfirm", {
      tokenAmount: {
        token: sellToken,
        amountString: maxBigIntForTransaction().toString(),
      },
      spender: quote.spender,
      spenderName: "0x Exchange",
      infoCalloutText: "Approving token to swap via 0x exchange.",
      transactionType: TransactionType.ApproveSpender,
      onSuccessCallback: onApproveSuccessCallback,
    });
  };

  const onTapSwapSettingsButton = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    setShowSwapSettings(true);
  };

  const hasRebaseToken = (): boolean => {
    return (
      (sellERC20 ? isRebaseToken(sellERC20?.address) : false) ||
      (buyERC20 ? isRebaseToken(buyERC20?.address) : false)
    );
  };

  const openAddTokens = () => {
    navigation.dispatch(CommonActions.navigate("AddTokens"));
  };

  const { notice: privateDisclaimerText } = useRelayAdaptPrivateNotice(
    isRailgun,
    "swap",
    "0x Exchange",
    "Railway DEX swaps are atomic and non-custodial."
  );

  const baseTokenError: Optional<Error> =
    isRailgun &&
    ((sellERC20?.isBaseToken ?? false) || (buyERC20?.isBaseToken ?? false))
      ? new Error(
          `You may not swap ${network.current.baseToken.symbol} privately, as this base token cannot be shielded. Try wrapped base token ${network.current.baseToken.wrappedSymbol} instead.`
        )
      : undefined;
  const tokenError: Optional<Error> =
    isRailgun && hasRebaseToken()
      ? new Error(
          "One of your selections is a Rebase Token, which may not be shielded."
        )
      : undefined;

  const error = baseTokenError ?? quoteError ?? tokenError;

  return (
    <>
      <ScrollView scrollEnabled={!showAmountEntry}>
        <View style={styles.sectionSell}>
          <SwapSellTokenAmountEntry
            isRailgun={isRailgun}
            sellToken={sellERC20}
            buyToken={buyERC20}
            currentQuote={quote}
            setSellToken={updateSellToken}
            sellTokenEntryString={sellTokenEntryString}
            setSellTokenEntryString={setSellTokenEntryString}
            setHasValidSellAmount={setHasValidSellAmount}
            openApprove={openApprove}
            onSaveAmount={() => {
              triggerHaptic(HapticSurface.SelectItem);
              setShowAmountEntry(false);
            }}
            showAmountEntry={showAmountEntry}
            validSellTokenAmount={sellERC20Amount}
            onSelectTokenAmount={onSelectTokenAmount}
          />
        </View>
        {!showAmountEntry && (
          <>
            <View style={styles.switchButtonContainer}>
              <ButtonIconOnly
                style={styles.switchButton}
                icon="swap-vertical"
                onTap={switchBuyAndSell}
                disabled={!sellERC20 || !buyERC20}
                size={20}
                color={styleguide.colors.white}
              />
            </View>
            <View style={styles.sectionBuy}>
              <SwapBuyERC20Amount
                isRailgun={isRailgun}
                sellERC20={sellERC20}
                buyERC20={buyERC20}
                buyERC20Amount={buyERC20Amount}
                setCurrentBuyERC20={updateBuyERC20}
                currentQuote={quote}
                isLoadingQuote={isLoadingQuote}
                onTapSwapSettingsButton={onTapSwapSettingsButton}
                openAddTokens={openAddTokens}
              />
            </View>
            {isRailgun && (
              <InfoCallout
                type={CalloutType.Info}
                text={privateDisclaimerText}
                style={styles.infoCallout}
                expandable
              />
            )}
            <WideButtonTextOnly
              title="Review order"
              additionalStyles={styles.reviewButton}
              onPress={onTapReviewOrder}
              disabled={!quote || !hasValidSellAmount || isDefined(error)}
            />
            {isDefined(error) && (
              <Text style={styles.errorText}>
                {error.message}{" "}
                <Text
                  style={styles.errorShowMore}
                  onPress={openErrorDetailsModal}
                >
                  (show more)
                </Text>
              </Text>
            )}
            {showErrorDetailsModal && isDefined(error) && (
              <ErrorDetailsModal
                error={error}
                show={showErrorDetailsModal}
                onDismiss={dismissErrorDetailsModal}
              />
            )}
          </>
        )}
      </ScrollView>
    </>
  );
};
