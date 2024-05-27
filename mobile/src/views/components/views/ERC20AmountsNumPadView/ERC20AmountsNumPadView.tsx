import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { ButtonTextOnly } from '@components/buttons/ButtonTextOnly/ButtonTextOnly';
import { ButtonWithTextAndIcon } from '@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon';
import { InfoCallout } from '@components/callouts/InfoCallout/InfoCallout';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { useSendERC20sNumInput } from '@hooks/inputs/useSendERC20sNumInput';
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
  TransactionType,
  useERC20Allowance,
  useERC20Balance,
  useRailgunShieldSpenderContract,
  useReduxSelector,
  useTopPickERC20,
} from '@react-shared';
import { SelectERC20Modal } from '@screens/modals/SelectERC20Modal/SelectERC20Modal';
import { HapticSurface, triggerHaptic } from '@services/util/haptic-service';
import { ApproveButton } from './ApproveButton/ApproveButton';
import { ERC20AmountRowView } from './ERC20AmountRowView';
import { styles } from './styles';

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
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const [error, setError] = useState<Optional<Error>>(undefined);
  const [showSelectERC20Modal, setShowSelectERC20Modal] = useState(false);
  const activeWallet = wallets.active;

  const { topPickToken } = useTopPickERC20(
    transactionType,
    navigationToken,
    isRailgunBalance,
    erc20Amounts,
  );

  const [currentToken, setCurrentToken] =
    useState<Optional<ERC20Token>>(topPickToken);

  useEffect(() => {
    if (erc20Amounts.length > 1 && currentToken) {
      if (
        (transactionType === TransactionType.Shield &&
          hasBaseToken(erc20Amounts)) ||
        (transactionType === TransactionType.Unshield &&
          hasWrappedBaseToken(erc20Amounts, network.current))
      ) {
        Alert.alert(
          'Incorrect entries',
          `You must ${transactionType} token ${getTokenDisplayNameShort(
            currentToken,
            wallets.available,
            network.current.name,
          )} in a transaction by itself. Please remove all other tokens from this transaction.`,
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
    setError,
  );

  let { tokenBalance } = useERC20Balance(
    activeWallet,
    currentToken,
    isRailgunBalance,
    balanceBucketFilter,
  );

  const onTapTokenSelector =
    disableERC20Selection === true
      ? undefined
      : () => {
          triggerHaptic(HapticSurface.NavigationButton);
          setShowSelectERC20Modal(true);
        };

  const {
    numEntryString,
    setNumEntryString,
    sendTokenNumberInput,
    pinEntryPanel,
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
        tokenAmount.token.decimals,
      ),
    );
    setShowAmountEntry(true);
  };

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
    erc20Amounts.some(tokenAmount => tokenAmount.token.isBaseToken);

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
            {showPinEntryPanel && pinEntryPanel}
            {showTokenApproveForShielding && (
              <ApproveButton
                pendingApproveTransaction={pendingApproveERC20Transaction}
                currentToken={currentToken}
                customStyles={styles.approveButton}
                approve={openApproveForShielding}
                approveText={
                  currentToken?.isBaseToken ?? false
                    ? `Approve ${network.current.baseToken.wrappedSymbol} to shield ${network.current.baseToken.symbol}`
                    : 'Approve for shielding'
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
                  {calculatedTokenAmounts?.map(tokenAmount => (
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
                    setNumEntryString('');
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
