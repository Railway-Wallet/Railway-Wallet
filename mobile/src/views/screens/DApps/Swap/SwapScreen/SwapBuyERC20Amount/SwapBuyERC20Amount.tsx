import { SwapQuoteData } from "@railgun-community/cookbook";
import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { ERC20EntryAmountButtonRow } from "@components/views/ERC20AmountsNumPadView/ERC20EntryAmountButtonRow/ERC20EntryAmountButtonRow";
import { SelectTokenInlineButton } from "@components/views/ERC20AmountsNumPadView/SelectTokenInlineButton/SelectTokenInlineButton";
import {
  ERC20Amount,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  getDecimalBalanceString,
  getTokenDisplayName,
  SelectTokenPurpose,
  styleguide,
  TransactionType,
  useReduxSelector,
} from "@react-shared";
import { SelectERC20Modal } from "@screens/modals/SelectERC20Modal/SelectERC20Modal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

const ZERO_X_PRICE_DECIMALS = 18;

type Props = {
  isRailgun: boolean;
  sellERC20: Optional<ERC20Token>;
  buyERC20: Optional<ERC20Token>;
  buyERC20Amount: Optional<ERC20Amount>;
  setCurrentBuyERC20: (token: ERC20Token) => void;
  currentQuote?: SwapQuoteData;
  isLoadingQuote: boolean;
  onTapSwapSettingsButton: () => void;
  openAddTokens: () => void;
};

export const SwapBuyERC20Amount: React.FC<Props> = ({
  isRailgun,
  sellERC20,
  buyERC20,
  buyERC20Amount,
  setCurrentBuyERC20,
  currentQuote,
  isLoadingQuote,
  onTapSwapSettingsButton,
  openAddTokens,
}: Props) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [showSelectERC20Modal, setShowSelectERC20Modal] = useState(false);
  const [
    reverseOrderSellBuyConversionText,
    setReverseOrderSellBuyConversionText,
  ] = useState(false);

  const onDismissSelectERC20Modal = (
    token?: ERC20Token,
    shouldOpenAddTokens: boolean = false
  ) => {
    setShowSelectERC20Modal(false);
    if (shouldOpenAddTokens) {
      triggerHaptic(HapticSurface.SelectItem);
      openAddTokens();
      return;
    }
    if (token) {
      triggerHaptic(HapticSurface.SelectItem);
      setCurrentBuyERC20(token);
    }
  };

  const onTapTokenSelector = () => {
    triggerHaptic(HapticSurface.SelectItem);
    setShowSelectERC20Modal(true);
  };

  const buyERC20AmountText =
    !isLoadingQuote && buyERC20Amount
      ? getDecimalBalanceString(
          BigInt(buyERC20Amount.amountString),
          buyERC20Amount.token.decimals
        )
      : undefined;

  const sellBuyConversionText = useMemo(() => {
    if (!sellERC20 || !buyERC20 || !currentQuote) {
      return;
    }

    if (reverseOrderSellBuyConversionText) {
      const quotePriceText = getDecimalBalanceString(
        (10n ** BigInt(ZERO_X_PRICE_DECIMALS) * 2n) / currentQuote.price,
        ZERO_X_PRICE_DECIMALS
      );
      return `1 ${getTokenDisplayName(
        buyERC20,
        wallets.available,
        network.current.name
      )} = ${quotePriceText} ${getTokenDisplayName(
        sellERC20,
        wallets.available,
        network.current.name
      )}`;
    }

    const quotePriceText = getDecimalBalanceString(
      currentQuote.price,
      ZERO_X_PRICE_DECIMALS
    );
    return `1 ${getTokenDisplayName(
      sellERC20,
      wallets.available,
      network.current.name
    )} = ${quotePriceText} ${getTokenDisplayName(
      buyERC20,
      wallets.available,
      network.current.name
    )}`;
  }, [
    wallets.available,
    buyERC20,
    currentQuote,
    sellERC20,
    network,
    reverseOrderSellBuyConversionText,
  ]);

  const swapSettingsView = () => {
    return (
      <ButtonIconOnly
        onTap={onTapSwapSettingsButton}
        icon="cog-outline"
        contentStyle={styles.buttonTextOnlyContent}
        size={20}
        color={styleguide.colors.white}
      />
    );
  };

  const tokenSelectorView = () => (
    <SelectTokenInlineButton
      token={buyERC20}
      onTapTokenSelector={onTapTokenSelector}
    />
  );

  return (
    <>
      <SelectERC20Modal
        show={showSelectERC20Modal}
        headerTitle="Select token to buy"
        skipBaseToken={false}
        onDismiss={onDismissSelectERC20Modal}
        isRailgun={isRailgun}
        purpose={SelectTokenPurpose.Transfer}
        transactionType={TransactionType.Swap}
        hasExistingTokenAmounts={false}
        showAddTokensButton={true}
        useRelayAdaptForBroadcasterFee={false}
        balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
      />
      <View style={styles.wrapper}>
        <ERC20EntryAmountButtonRow
          autoFocus={false}
          numEntryString={buyERC20AmountText ?? ""}
          leftView={swapSettingsView}
          rightView={tokenSelectorView}
          placeholder={formatNumberToLocaleWithMinDecimals(0, 2)}
        />
        <Text
          style={styles.sectionHeaderRightText}
          onPress={() => {
            triggerHaptic(HapticSurface.SelectItem);
            setReverseOrderSellBuyConversionText(
              !reverseOrderSellBuyConversionText
            );
          }}
        >
          {isLoadingQuote ? "Getting best price..." : sellBuyConversionText}
        </Text>
      </View>
    </>
  );
};
