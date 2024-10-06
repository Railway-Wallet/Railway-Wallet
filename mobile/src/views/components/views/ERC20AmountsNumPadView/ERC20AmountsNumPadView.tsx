import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { ButtonTextOnly } from "@components/buttons/ButtonTextOnly/ButtonTextOnly";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { FullScreenSpinner } from "@components/loading/FullScreenSpinner/FullScreenSpinner";
import { useSendERC20sNumInput } from "@hooks/inputs/useSendERC20sNumInput";
import {
  CalloutType,
  compareTokens,
  ERC20Amount,
  ERC20Token,
  formatUnitFromHexString,
  getTokenDisplayNameShort,
  hasBaseToken,
  hasOnlyBaseToken,
  hasOnlyWrappedBaseToken,
  hasWrappedBaseToken,
  SelectTokenPurpose,
  stringEntryToBigInt,
  styleguide,
  TransactionType,
  useERC20Allowance,
  useERC20Balance,
  useRailgunShieldSpenderContract,
  useReduxSelector,
  useTopPickERC20,
} from "@react-shared";
import { SelectERC20Modal } from "@screens/modals/SelectERC20Modal/SelectERC20Modal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { COMMON_HIT_SLOP } from "@utils/constants";
import { Icon } from "@views/components/icons/Icon";
import { Checkbox } from "@views/components/inputs/Checkbox/Checkbox";
import { ApproveButton } from "./ApproveButton/ApproveButton";
import { ERC20AmountRowView } from "./ERC20AmountRowView";
import { styles } from "./styles";

type Props = {
  transactionType: TransactionType;
  canSendMultipleTokens: boolean;
  isRailgunBalance: boolean;
  navigationToken: Optional<ERC20Token>;
  showAmountEntry: boolean;
  setShowAmountEntry: (value: boolean) => void;
  erc20Amounts: ERC20Amount[];
  setTokenAmounts: (value: ERC20Amount[]) => void;
  openApproveForShielding?: (token: ERC20Token) => void;
  focused: boolean;
  onTouchEnd?: () => void;
  disableERC20Selection?: boolean;
  calculatedError?: string;
  calculatedTokenAmounts?: ERC20Amount[];
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const ERC20AmountsNumPadView: React.FC<Props> = ({
  transactionType,
  canSendMultipleTokens,
  isRailgunBalance,
  navigationToken,
  showAmountEntry,
  setShowAmountEntry,
  erc20Amounts,
  setTokenAmounts,
  openApproveForShielding,
  focused,
  onTouchEnd,
  disableERC20Selection,
  calculatedError,
  calculatedTokenAmounts,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { topPickToken } = useTopPickERC20(
    transactionType,
    navigationToken,
    isRailgunBalance,
    erc20Amounts
  );

  const [singleFeeChecked, setSingleFeeChecked] = useState(false);
  const [bothFeesChecked, setBothFeesChecked] = useState(false);
  const [error, setError] = useState<Optional<Error>>(undefined);
  const [showSelectERC20Modal, setShowSelectERC20Modal] = useState(false);
  const [currentToken, setCurrentToken] =
    useState<Optional<ERC20Token>>(topPickToken);

  const isShieldView = transactionType === TransactionType.Shield;
  const isUnshieldView = transactionType === TransactionType.Unshield;
  const activeWallet = wallets.active;

  useEffect(() => {
    if (erc20Amounts.length > 1 && currentToken) {
      if (
        (transactionType === TransactionType.Shield &&
          hasBaseToken(erc20Amounts)) ||
        (transactionType === TransactionType.Unshield &&
          hasWrappedBaseToken(erc20Amounts, network.current))
      ) {
        Alert.alert(
          "Incorrect entries",
          `You must ${transactionType} token ${getTokenDisplayNameShort(
            currentToken,
            wallets.available,
            network.current.name
          )} in a transaction by itself. Please remove all other tokens from this transaction.`
        );
      }
    }
  }, [currentToken, network, erc20Amounts, transactionType, wallets.available]);

  const { shieldApproveSpender } = useRailgunShieldSpenderContract();
  const {
    erc20Allowance,
    pendingApproveERC20Transaction,
    resetERC20Allowance,
    requiresApproval,
  } = useERC20Allowance(
    currentToken,
    transactionType,
    shieldApproveSpender,
    isRailgunBalance,
    setError
  );

  const onTapTokenSelector =
    disableERC20Selection === true
      ? undefined
      : () => {
          triggerHaptic(HapticSurface.NavigationButton);
          setShowSelectERC20Modal(true);
        };

  let { tokenBalance } = useERC20Balance(
    activeWallet,
    currentToken,
    isRailgunBalance,
    balanceBucketFilter
  );

  const {
    numEntryString,
    setNumEntryString,
    sendTokenNumberInput,
    finalEntryString,
  } = useSendERC20sNumInput(
    transactionType,
    error,
    setError,
    currentToken,
    tokenBalance ?? 0n,
    setShowAmountEntry,
    onTapTokenSelector,
    erc20Amounts,
    setTokenAmounts,
    erc20Allowance,
    isRailgunBalance,
    balanceBucketFilter,
    requiresApproval,
    focused,
    singleFeeChecked,
    bothFeesChecked
  );

  const onRemoveToken = useCallback(() => {
    const newTokenAmounts = [];
    for (const tokenAmount of erc20Amounts) {
      if (compareTokens(tokenAmount.token, currentToken)) {
        continue;
      }
      newTokenAmounts.push(tokenAmount);
    }

    triggerHaptic(HapticSurface.EditSuccess);
    setTokenAmounts(newTokenAmounts);
    setShowAmountEntry(false);
  }, [currentToken, erc20Amounts, setShowAmountEntry, setTokenAmounts]);

  const onCancelAmount = () => {
    setShowAmountEntry(false);
  };

  const onDismissSelectERC20Modal = (token?: ERC20Token) => {
    if (token && currentToken && !compareTokens(currentToken, token)) {
      setCurrentToken(token);
      resetERC20Allowance();
    }
    triggerHaptic(HapticSurface.SelectItem);
    setShowSelectERC20Modal(false);
  };

  const onSelectTokenAmount = (tokenAmount: ERC20Amount) => {
    triggerHaptic(HapticSurface.SelectItem);
    setCurrentToken(tokenAmount.token);
    onRemoveToken();
    setNumEntryString(
      formatUnitFromHexString(
        tokenAmount.amountString,
        tokenAmount.token.decimals
      )
    );
    setShowAmountEntry(true);
  };

  const renderFeeCheckboxDisclaimerInfo = (title: string, message: string) => (
    <TouchableOpacity
      activeOpacity={0.5}
      style={styles.disclaimerContainer}
      hitSlop={COMMON_HIT_SLOP}
      onPress={() => {
        Alert.alert(title, message, [
          {
            text: "Cancel",
            style: "destructive",
          },
        ]);
      }}
    >
      <Icon
        size={20}
        source="alert-circle"
        color={styleguide.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const showTokenApproveForShielding =
    requiresApproval &&
    isDefined(erc20Allowance) &&
    isDefined(currentToken) &&
    (erc20Allowance === 0n ||
      erc20Allowance <
        stringEntryToBigInt(numEntryString, currentToken.decimals));

  const showPinEntryPanel =
    !showTokenApproveForShielding &&
    !(
      (requiresApproval && !isDefined(erc20Allowance)) ||
      erc20Allowance === 0n
    );

  const showLoadingPinEntryPanel =
    !showTokenApproveForShielding && !showPinEntryPanel;

  const needsShieldBaseTokenCallout =
    transactionType === TransactionType.Shield &&
    erc20Amounts.some((tokenAmount) => tokenAmount.token.isBaseToken);

  return (
    <>
      <SelectERC20Modal
        show={showSelectERC20Modal}
        headerTitle="Select token"
        skipBaseToken={false}
        onDismiss={onDismissSelectERC20Modal}
        isRailgun={isRailgunBalance}
        purpose={SelectTokenPurpose.Transfer}
        transactionType={transactionType}
        hasExistingTokenAmounts={erc20Amounts.length > 0}
        useRelayAdaptForBroadcasterFee={false}
        balanceBucketFilter={balanceBucketFilter}
      />
      <View onTouchEnd={onTouchEnd}>
        {showAmountEntry && (
          <>
            {sendTokenNumberInput}
            {(isShieldView || isUnshieldView) && (
              <View style={styles.checkboxContainer}>
                <Checkbox
                  selected={singleFeeChecked}
                  rightView={renderFeeCheckboxDisclaimerInfo(
                    `${isUnshieldView ? "Unshield" : "Shield"} fee included`,
                    "This is useful if you would like the destination 0zk address to receive the amount entered after the fee. If selected, the shield fee amount will be added to your input amount.\n\nIf left unselected, the shield fee will be taken out of your input amount. The destination 0zk address will receive the amount originally entered minus the shield fee."
                  )}
                  label={`Add ${
                    isUnshieldView ? "unshield" : "shield"
                  } fee to input`}
                  onPress={() => {
                    setSingleFeeChecked(!singleFeeChecked);
                    setBothFeesChecked(false);
                  }}
                />
                {isShieldView && (
                  <Checkbox
                    selected={bothFeesChecked}
                    rightView={renderFeeCheckboxDisclaimerInfo(
                      "Shield and unshield fee included",
                      "This is useful if you would like the destination 0zk address to be able to unshield and end up with the amount you entered after fees are applied. If selected, the shield fee and unshield fee amounts will be added to your input amount.\n\nIf left unselected, only the shield fee will be taken out of your input amount. The destination 0zk address will receive the amount originally entered minus the shield fee."
                    )}
                    label="Add shield and unshield fee to input"
                    onPress={() => {
                      setBothFeesChecked(!bothFeesChecked);
                      setSingleFeeChecked(false);
                    }}
                  />
                )}
                {(singleFeeChecked || bothFeesChecked) &&
                  currentToken &&
                  numEntryString && (
                    <Text style={styles.tokenBalanceWithFeesText}>
                      {`Total with ${
                        bothFeesChecked
                          ? "shield and unshield fee"
                          : `${isShieldView ? "shield" : "unshield"} fee`
                      }: ${finalEntryString}`}
                    </Text>
                  )}
              </View>
            )}
            {showTokenApproveForShielding && (
              <ApproveButton
                pendingApproveTransaction={pendingApproveERC20Transaction}
                currentToken={currentToken}
                customStyles={styles.approveButton}
                approve={openApproveForShielding}
                approveText={
                  currentToken?.isBaseToken ?? false
                    ? `Approve ${network.current.baseToken.wrappedSymbol} to shield ${network.current.baseToken.symbol}`
                    : "Approve for shielding"
                }
              />
            )}
            <View style={styles.bottomButtons}>
              {canSendMultipleTokens && erc20Amounts.length > 0 && (
                <View style={styles.bottomButton}>
                  <ButtonTextOnly
                    title="Remove"
                    onTap={onRemoveToken}
                    labelStyle={styles.bottomButtonLabel}
                    testID="ERC20AmountsNumPadView-OnRemoveToken-Button"
                  />
                </View>
              )}
              {erc20Amounts.length > 0 && !showLoadingPinEntryPanel && (
                <View style={styles.bottomButton}>
                  <ButtonTextOnly
                    title="Cancel"
                    onTap={onCancelAmount}
                    labelStyle={styles.bottomButtonLabel}
                  />
                </View>
              )}
            </View>
            <FullScreenSpinner
              text="Loading token..."
              show={showLoadingPinEntryPanel}
            />
          </>
        )}
        {!showAmountEntry && (
          <>
            <View style={styles.tokenListWrapper}>
              {erc20Amounts.map((tokenAmount, index) => (
                <ERC20AmountRowView
                  key={index}
                  tokenAmount={tokenAmount}
                  onSelectTokenAmount={() => onSelectTokenAmount(tokenAmount)}
                />
              ))}
              {isDefined(calculatedTokenAmounts) && (
                <View style={styles.calculatedTokenListWrapper}>
                  {calculatedTokenAmounts?.map((tokenAmount) => (
                    <ERC20AmountRowView
                      isCalculated
                      key={tokenAmount.token.address}
                      errorText={calculatedError}
                      tokenAmount={tokenAmount}
                    />
                  ))}
                </View>
              )}
              {needsShieldBaseTokenCallout && (
                <InfoCallout
                  type={CalloutType.Info}
                  text={`RAILGUN does not allow shielding of base tokens. This transaction will automatically wrap your ${network.current.baseToken.symbol} into ${network.current.baseToken.wrappedSymbol} (1 to 1), and shield the wrapped tokens into RAILGUN. When unshielding, you will have the option to unwrap into ${network.current.baseToken.symbol}.`}
                />
              )}
              {!needsShieldBaseTokenCallout && canSendMultipleTokens && (
                <ButtonWithTextAndIcon
                  icon="plus"
                  title="Another Token"
                  onPress={() => {
                    triggerHaptic(HapticSurface.SelectItem);
                    setNumEntryString("");
                    setShowAmountEntry(true);
                    setCurrentToken(topPickToken);
                  }}
                  additionalStyles={styles.newTokenButton}
                  disabled={
                    (transactionType === TransactionType.Shield &&
                      hasOnlyBaseToken(erc20Amounts)) ||
                    (transactionType === TransactionType.Unshield &&
                      hasOnlyWrappedBaseToken(erc20Amounts, network.current))
                  }
                />
              )}
            </View>
          </>
        )}
      </View>
    </>
  );
};
