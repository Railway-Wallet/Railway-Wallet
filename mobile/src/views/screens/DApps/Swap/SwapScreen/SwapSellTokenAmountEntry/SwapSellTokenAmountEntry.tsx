import { SwapQuoteData } from "@railgun-community/cookbook";
import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { ApproveButton } from "@components/views/ERC20AmountsNumPadView/ApproveButton/ApproveButton";
import { ERC20AmountRowView } from "@components/views/ERC20AmountsNumPadView/ERC20AmountRowView";
import { SendERC20sNumberInput } from "@components/views/ERC20AmountsNumPadView/SendERC20sNumberInput/SendERC20sNumberInput";
import {
  compareTokens,
  ERC20Amount,
  ERC20Token,
  formatUnitFromHexString,
  getTokenDisplayName,
  isWrappedBaseTokenForNetwork,
  SelectTokenPurpose,
  stringEntryToBigInt,
  TransactionType,
  useERC20Allowance,
  useERC20Balance,
  useReduxSelector,
  useValidateNumEntry,
} from "@react-shared";
import { SelectERC20Modal } from "@screens/modals/SelectERC20Modal/SelectERC20Modal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

type Props = {
  isRailgun: boolean;
  sellToken: Optional<ERC20Token>;
  buyToken: Optional<ERC20Token>;
  setSellToken: (token: ERC20Token) => void;
  sellTokenEntryString: string;
  setSellTokenEntryString: (entryString: string) => void;
  currentQuote?: SwapQuoteData;
  setHasValidSellAmount: (isValid: boolean) => void;
  openApprove: (token: ERC20Token) => void;
  onSaveAmount: () => void;
  showAmountEntry: boolean;
  validSellTokenAmount: Optional<ERC20Amount>;
  onSelectTokenAmount: (tokenAmount: ERC20Amount) => void;
};

export const SwapSellTokenAmountEntry: React.FC<Props> = ({
  isRailgun,
  sellToken,
  buyToken,
  setSellToken,
  sellTokenEntryString,
  setSellTokenEntryString,
  currentQuote,
  setHasValidSellAmount,
  openApprove,
  onSaveAmount,
  showAmountEntry,
  validSellTokenAmount,
  onSelectTokenAmount,
}: Props) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const activeWallet = wallets.active;

  const [showSelectERC20Modal, setShowSelectERC20Modal] = useState(false);

  const [sellTokenError, setSellTokenError] =
    useState<Optional<Error>>(undefined);

  const currentSellToken = useRef<Optional<ERC20Token>>(undefined);

  const onDismissSelectERC20Modal = (token?: ERC20Token) => {
    if (token && !compareTokens(token, sellToken)) {
      triggerHaptic(HapticSurface.SelectItem);
      setSellToken(token);
      resetERC20Allowance();
    }
    setShowSelectERC20Modal(false);
  };

  const transactionType = TransactionType.Swap;

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  const { tokenBalance } = useERC20Balance(
    activeWallet,
    sellToken,
    isRailgun,
    balanceBucketFilter
  );

  useEffect(() => {
    currentSellToken.current = sellToken;
  }, [sellToken]);

  const {
    erc20Allowance,
    pendingApproveERC20Transaction,
    resetERC20Allowance,
    requiresApproval,
  } = useERC20Allowance(
    sellToken,
    transactionType,
    currentQuote?.spender,
    isRailgun,
    setSellTokenError
  );

  const showTokenApprove =
    requiresApproval &&
    isDefined(currentSellToken.current) &&
    currentSellToken.current === sellToken &&
    isDefined(erc20Allowance) &&
    (erc20Allowance === 0n ||
      erc20Allowance <
        stringEntryToBigInt(
          sellTokenEntryString,
          currentSellToken.current.decimals
        ));

  const { hasValidNumEntry, disableNumPad } = useValidateNumEntry(
    setSellTokenError,
    sellTokenEntryString,
    erc20Allowance,
    requiresApproval,
    tokenBalance ?? 0n,
    transactionType,
    sellToken,
    isRailgun
  );

  useEffect(() => {
    const isBaseTokenUnwrap =
      isDefined(sellToken) &&
      isWrappedBaseTokenForNetwork(sellToken, network.current) &&
      isDefined(buyToken) &&
      (buyToken.isBaseToken ?? false);

    const hasValidApproval =
      isBaseTokenUnwrap ||
      (!(requiresApproval && !isDefined(erc20Allowance)) && !showTokenApprove);
    setHasValidSellAmount(hasValidNumEntry && hasValidApproval);
  }, [
    sellToken,
    network,
    buyToken,
    hasValidNumEntry,
    requiresApproval,
    setHasValidSellAmount,
    showTokenApprove,
    erc20Allowance,
  ]);

  const onTapTokenSelector = () => {
    triggerHaptic(HapticSurface.SelectItem);
    setShowSelectERC20Modal(true);
  };

  const onTapMaxButton = () => {
    if (disableNumPad) {
      return;
    }
    if (!sellToken) {
      return;
    }
    triggerHaptic(HapticSurface.SelectItem);
    const newString = formatUnitFromHexString(
      tokenBalance ?? 0n,
      sellToken.decimals
    );
    setSellTokenEntryString(newString);
  };

  const onTapClearButton = () => {
    triggerHaptic(HapticSurface.SelectItem);
    setSellTokenEntryString("");
  };

  return (
    <>
      <SelectERC20Modal
        show={showSelectERC20Modal}
        headerTitle="Select token to sell"
        skipBaseToken={isRailgun}
        onDismiss={onDismissSelectERC20Modal}
        isRailgun={isRailgun}
        purpose={SelectTokenPurpose.Transfer}
        transactionType={transactionType}
        hasExistingTokenAmounts={false}
        useRelayAdaptForBroadcasterFee={false}
        balanceBucketFilter={balanceBucketFilter}
      />
      {showAmountEntry && (
        <>
          <SendERC20sNumberInput
            token={sellToken}
            isRailgunBalance={isRailgun}
            transactionType={transactionType}
            numEntryString={sellTokenEntryString}
            onTapMaxButton={onTapMaxButton}
            onTapClearButton={onTapClearButton}
            onTapTokenSelector={onTapTokenSelector}
            updateAmount={setSellTokenEntryString}
            onSaveAmount={onSaveAmount}
            hasValidNumEntry={hasValidNumEntry}
            error={sellTokenError}
            focused={true}
            balanceBucketFilter={balanceBucketFilter}
          />
        </>
      )}
      {!showAmountEntry && validSellTokenAmount && (
        <View style={styles.tokenRowWrapper}>
          <ERC20AmountRowView
            tokenAmount={validSellTokenAmount}
            onSelectTokenAmount={() =>
              onSelectTokenAmount(validSellTokenAmount)
            }
            error={!hasValidNumEntry}
          />
        </View>
      )}
      {showTokenApprove && isDefined(sellToken) && (
        <ApproveButton
          pendingApproveTransaction={pendingApproveERC20Transaction}
          currentToken={sellToken}
          approve={openApprove}
          approveText={`Approve ${getTokenDisplayName(
            sellToken,
            wallets.available,
            network.current.name
          )} for 0x Exchange`}
          customStyles={styles.approveButton}
        />
      )}
    </>
  );
};
