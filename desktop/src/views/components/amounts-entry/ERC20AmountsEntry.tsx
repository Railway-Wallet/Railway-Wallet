import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import React, { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { ApproveButton } from '@components/ApproveButton/ApproveButton';
import { Button } from '@components/Button/Button';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Input } from '@components/Input/Input';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { Text } from '@components/Text/Text';
import {
  CalloutType,
  compareTokens,
  ERC20Amount,
  ERC20Token,
  formatEntryAmountWithFeesIfNeeded,
  formatUnitFromHexString,
  formatUnitFromHexStringToLocale,
  getTokenDisplayName,
  getTokenDisplayNameShort,
  hasBaseToken,
  hasOnlyBaseToken,
  imageForToken,
  maxBalanceAvailableToShield,
  SearchableERC20,
  SelectTokenPurpose,
  stringEntryToBigInt,
  styleguide,
  TransactionType,
  useAddMultipleTokens,
  useERC20Allowance,
  useERC20Balance,
  useRailgunFees,
  useRailgunShieldSpenderContract,
  useReduxSelector,
  useTopPickERC20,
  useValidateNumEntry,
} from '@react-shared';
import { SelectERC20Modal } from '@screens/modals/SelectTokenModal/SelectERC20Modal';
import { IconType, renderIcon } from '@services/util/icon-service';
import { parseTokenIcon } from '@utils/images';
import { AddCustomTokenModal } from '../../screens/modals/AddCustomTokenModal/AddCustomTokenModal';
import { Checkbox } from '../Checkbox/Checkbox';
import { ERC20AmountRowView } from './ERC20AmountRowView';
import styles from './AmountsEntry.module.scss';

type Props = {
  transactionType: TransactionType;
  canSendMultipleTokens: boolean;
  isRailgunBalance: boolean;
  initialToken: Optional<ERC20Token>;
  requiresAddTokens: Optional<SearchableERC20[]>;
  requiresAddTokenDescription?: string;
  showAmountEntry: boolean;
  setShowAmountEntry: (value: boolean) => void;
  tokenAmounts: ERC20Amount[];
  setTokenAmounts: (value: ERC20Amount[]) => void;
  openApproveForShielding?: (token: ERC20Token) => void;
  disableERC20Selection?: boolean;
  calculatedError?: Error;
  calculatedTokenAmounts?: ERC20Amount[];
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const ERC20AmountsEntry: React.FC<Props> = ({
  transactionType,
  canSendMultipleTokens,
  isRailgunBalance,
  initialToken,
  requiresAddTokens,
  requiresAddTokenDescription,
  showAmountEntry,
  setShowAmountEntry,
  tokenAmounts,
  setTokenAmounts,
  openApproveForShielding,
  disableERC20Selection,
  calculatedError,
  calculatedTokenAmounts,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const activeWallet = wallets.active;

  const [error, setError] = useState<Optional<Error>>(undefined);
  const [singleFeeChecked, setSingleFeeChecked] = useState(false);
  const [bothFeesChecked, setBothFeesChecked] = useState(false);
  const [showSelectERC20Modal, setShowSelectERC20Modal] = useState(false);
  const [numEntryString, setNumEntryString] = useState('');
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);

  const { shieldFee, unshieldFee } = useRailgunFees(transactionType);
  const { currentTokenToAdd, onTokenAddSuccess } =
    useAddMultipleTokens(requiresAddTokens);
  const { topPickToken } = useTopPickERC20(
    transactionType,
    initialToken,
    isRailgunBalance,
    tokenAmounts,
  );
  const isShieldView = transactionType === TransactionType.Shield;
  const isUnshieldView = transactionType === TransactionType.Unshield;

  const [currentToken, setCurrentToken] =
    useState<Optional<ERC20Token>>(topPickToken);

  const openAddTokenModal = () => {
    setShowAddTokenModal(true);
  };

  useEffect(() => {
    if (tokenAmounts.length > 1 && currentToken) {
      if (isShieldView && hasBaseToken(tokenAmounts)) {
        setAlert({
          title: 'Incorrect entries',
          message: `You must ${transactionType} token ${getTokenDisplayName(
            currentToken,
            wallets.available,
            network.current.name,
          )} in a transaction by itself. Please remove all other tokens from this transaction.`,
          onClose: () => setAlert(undefined),
        });
      }
    }
  }, [
    activeWallet,
    currentToken,
    isShieldView,
    network,
    tokenAmounts,
    transactionType,
    wallets.available,
  ]);

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

  const { tokenBalance } = useERC20Balance(
    activeWallet,
    currentToken,
    isRailgunBalance,
    balanceBucketFilter,
  );

  const { finalEntryBigInt, finalEntryString } = useMemo(() => {
    if (!isDefined(currentToken)) {
      return { finalEntryBigInt: 0n, finalEntryString: '' };
    }

    const addShieldFee = (singleFeeChecked && isShieldView) || bothFeesChecked;
    const addUnshieldFee =
      (singleFeeChecked && isUnshieldView) || bothFeesChecked;
    const { finalEntryBigInt, finalEntryString } =
      formatEntryAmountWithFeesIfNeeded(
        numEntryString,
        currentToken.decimals,
        addShieldFee ? shieldFee : undefined,
        addUnshieldFee ? unshieldFee : undefined,
      );

    return { finalEntryBigInt, finalEntryString };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    numEntryString,
    currentToken,
    shieldFee,
    unshieldFee,
    singleFeeChecked,
    bothFeesChecked,
  ]);

  const { hasValidNumEntry, disableNumPad } = useValidateNumEntry(
    setError,
    finalEntryBigInt,
    erc20Allowance,
    requiresApproval,
    tokenBalance ?? 0n,
    transactionType,
    currentToken,
    isRailgunBalance,
  );

  const onTapTokenSelector =
    disableERC20Selection === true
      ? undefined
      : () => {
          setShowSelectERC20Modal(true);
        };

  const onRemoveToken = (token?: ERC20Token) => {
    const newTokenAmounts = [];
    for (const tokenAmount of tokenAmounts) {
      if (compareTokens(tokenAmount.token, token)) {
        continue;
      }
      newTokenAmounts.push(tokenAmount);
    }
    setTokenAmounts(newTokenAmounts);
    setShowAmountEntry(false);
  };

  const onCancelAmount = () => {
    setShowAmountEntry(false);
  };

  const onDismissSelectERC20Modal = (token?: ERC20Token) => {
    if (token && !compareTokens(token, currentToken)) {
      setCurrentToken(token);
      resetERC20Allowance();
    }
    setShowSelectERC20Modal(false);
  };

  const onSelectERC20Amount = (tokenAmount: ERC20Amount) => {
    setCurrentToken(tokenAmount.token);
    onRemoveToken(tokenAmount.token);
    setNumEntryString(
      formatUnitFromHexString(
        tokenAmount.amountString,
        tokenAmount.token.decimals,
      ),
    );
    setShowAmountEntry(true);
  };

  const onTapMaxButton = () => {
    if (disableNumPad) {
      return;
    }
    if (!currentToken) {
      return;
    }

    setSingleFeeChecked(false);
    setBothFeesChecked(false);

    let adjustedMaxAmount = tokenBalance ?? 0n;
    if (isShieldView) {
      adjustedMaxAmount = maxBalanceAvailableToShield(
        tokenBalance ?? 0n,
        shieldFee,
      );
    }

    const newString = formatUnitFromHexString(
      adjustedMaxAmount,
      currentToken.decimals,
    );
    setNumEntryString(newString);
  };

  const onSaveAmount = () => {
    if (!currentToken) {
      return;
    }
    let updated = false;

    const savedTokenAmount: ERC20Amount = {
      token: currentToken,
      amountString: finalEntryBigInt.toString(),
    };

    const newTokenAmounts: ERC20Amount[] = [];
    for (const tokenAmount of tokenAmounts) {
      if (compareTokens(tokenAmount.token, currentToken)) {
        updated = true;
        newTokenAmounts.push(savedTokenAmount);
        continue;
      }
      newTokenAmounts.push(tokenAmount);
    }
    if (!updated) {
      newTokenAmounts.push(savedTokenAmount);
    }

    setTokenAmounts(newTokenAmounts);
    setShowAmountEntry(false);
  };

  const renderFeeCheckboxDisclaimerInfo = (message: string) => (
    <div
      onClick={() => {
        setAlert({
          title: 'What is this?',
          message,
          onClose: () => setAlert(undefined),
        });
      }}
      className={styles.feeCheckboxDisclaimerInfo}
    >
      {renderIcon(IconType.Info, 18, styleguide.colors.textSecondary)}
    </div>
  );

  const showTokenApproveForShielding =
    requiresApproval &&
    isDefined(erc20Allowance) &&
    isDefined(currentToken) &&
    (erc20Allowance === 0n ||
      erc20Allowance <
        stringEntryToBigInt(numEntryString, currentToken.decimals));

  const enableAmountEntry =
    !showTokenApproveForShielding &&
    !(
      requiresApproval &&
      (!isDefined(erc20Allowance) || erc20Allowance === 0n)
    );

  const showLoadingPinEntryPanel =
    !showTokenApproveForShielding && !enableAmountEntry;

  const isShieldBaseToken =
    (currentToken?.isBaseToken ?? false) && isShieldView;

  return (
    <>
      {showAddTokenModal && isDefined(currentTokenToAdd) && (
        <AddCustomTokenModal
          initialFullToken={currentTokenToAdd}
          onClose={() => setShowAddTokenModal(false)}
          onSuccessAddedToken={onTokenAddSuccess}
        />
      )}
      {showSelectERC20Modal && (
        <SelectERC20Modal
          headerTitle="Select token"
          skipBaseToken={false}
          onDismiss={onDismissSelectERC20Modal}
          isRailgun={isRailgunBalance}
          purpose={SelectTokenPurpose.Transfer}
          transactionType={transactionType}
          hasExistingTokenAmounts={tokenAmounts.length > 0}
          useRelayAdaptForBroadcasterFee={false}
          balanceBucketFilter={balanceBucketFilter}
        />
      )}
      {!showAmountEntry && (
        <div className={styles.tokenListWrapper}>
          {tokenAmounts.map((tokenAmount, index) => (
            <ERC20AmountRowView
              tokenAmount={tokenAmount}
              onSelectERC20Amount={() => onSelectERC20Amount(tokenAmount)}
              index={index}
              key={tokenAmount.token.address}
            />
          ))}
          {isDefined(calculatedTokenAmounts) &&
            calculatedTokenAmounts?.map(tokenAmount => (
              <ERC20AmountRowView
                isCalculated
                key={tokenAmount.token.address}
                error={calculatedError}
                tokenAmount={tokenAmount}
              />
            ))}
        </div>
      )}
      {showAmountEntry && (
        <>
          <div className={styles.addTokenContainer}>
            <Text className={styles.addTokenLabel}>
              {canSendMultipleTokens ? 'Add token:' : 'Amount:'}
            </Text>
            {tokenAmounts.length > 0 && (
              <div className={styles.closeIcon} onClick={onCancelAmount}>
                {renderIcon(IconType.Close, 18)}
              </div>
            )}
          </div>
          <div className={styles.amountInputContainer}>
            <Input
              onChange={e => setNumEntryString(e.target.value)}
              placeholder="Amount"
              type="number"
              value={numEntryString}
              hasError={numEntryString.length > 0 && !hasValidNumEntry}
              rightView={
                <Button
                  children="MAX"
                  onClick={onTapMaxButton}
                  textClassName={styles.bottomButtonLabel}
                  buttonClassName={styles.inputInsetButton}
                />
              }
              testId="erc20-amount-input"
            />
            <Button
              children={
                currentToken
                  ? getTokenDisplayNameShort(
                      currentToken,
                      wallets.available,
                      network.current.name,
                    )
                  : 'N/A'
              }
              onClick={onTapTokenSelector}
              textClassName={styles.bottomButtonLabel}
              buttonClassName={cn(
                styles.selectTokenButton,
                disableERC20Selection === true
                  ? styles.selectTokenButtonDisabled
                  : undefined,
              )}
              endIcon={
                currentToken
                  ? parseTokenIcon(imageForToken(currentToken))
                  : undefined
              }
            />
          </div>
          {currentToken && (
            <Text className={styles.tokenBalanceText}>
              {`${isRailgunBalance ? 'Spendable private' : 'Public'} balance: ${
                isDefined(tokenBalance)
                  ? formatUnitFromHexStringToLocale(
                      tokenBalance,
                      currentToken.decimals,
                    )
                  : 'Loading...'
              }`}
            </Text>
          )}
          {(isShieldView || isUnshieldView) && (
            <div className={styles.checkboxContainer}>
              <Checkbox
                medium
                className={styles.checkbox}
                checked={singleFeeChecked}
                rightView={renderFeeCheckboxDisclaimerInfo(
                  'This is useful if you would like the destination 0zk address to receive the amount entered after the fee. If selected, the shield fee amount will be added to your input amount.\n\nIf left unselected, the shield fee will be taken out of your input amount. The destination 0zk address will receive the amount originally entered minus the shield fee.',
                )}
                label={`Add ${
                  isUnshieldView ? 'unshield' : 'shield'
                } fee to input`}
                handleCheck={() => {
                  setSingleFeeChecked(!singleFeeChecked);
                  setBothFeesChecked(false);
                }}
              />
              {isShieldView && (
                <Checkbox
                  medium
                  className={styles.checkbox}
                  checked={bothFeesChecked}
                  rightView={renderFeeCheckboxDisclaimerInfo(
                    'This is useful if you would like the destination 0zk address to be able to unshield and end up with the amount you entered after fees are applied. If selected, the shield fee and unshield fee amounts will be added to your input amount.\n\nIf left unselected, only the shield fee will be taken out of your input amount. The destination 0zk address will receive the amount originally entered minus the shield fee.',
                  )}
                  label="Add shield and unshield fee to input"
                  handleCheck={() => {
                    setBothFeesChecked(!bothFeesChecked);
                    setSingleFeeChecked(false);
                  }}
                />
              )}
              {(singleFeeChecked || bothFeesChecked) &&
                currentToken &&
                numEntryString && (
                  <Text className={styles.tokenBalanceWithFeesText}>
                    {`Total with ${
                      bothFeesChecked
                        ? 'shield and unshield fee'
                        : `${isShieldView ? 'shield' : 'unshield'} fee`
                    }: ${finalEntryString}`}
                  </Text>
                )}
            </div>
          )}
          {isDefined(error) && (
            <Text className={styles.errorAddressText}>{error.message}</Text>
          )}
          {!showTokenApproveForShielding && !showLoadingPinEntryPanel && (
            <div className={styles.buttonGroup}>
              <Button
                children="Confirm amount"
                disabled={!hasValidNumEntry}
                onClick={onSaveAmount}
                textClassName={styles.bottomButtonLabel}
                buttonClassName={styles.amountActionButton}
              />
            </div>
          )}
          {showTokenApproveForShielding && (
            <ApproveButton
              pendingApproveTransaction={pendingApproveERC20Transaction}
              buttonClassName={styles.approveTokenButton}
              textClassName={styles.bottomButtonLabel}
              approve={() => {
                if (!openApproveForShielding) {
                  return;
                }
                openApproveForShielding(currentToken);
              }}
              approveText={
                currentToken?.isBaseToken ?? false
                  ? `Approve ${network.current.baseToken.wrappedSymbol} to shield ${network.current.baseToken.symbol}`
                  : `Approve ${getTokenDisplayName(
                      currentToken,
                      wallets.available,
                      network.current.name,
                    )} for shielding`
              }
            />
          )}
          {isShieldBaseToken && (
            <InfoCallout
              type={CalloutType.Info}
              text={`RAILGUN does not allow shielding of base tokens. This transaction will automatically wrap your ${network.current.baseToken.symbol} into ${network.current.baseToken.wrappedSymbol} (1 to 1), and shield the wrapped tokens into RAILGUN. When unshielding, you will have the option to unwrap into ${network.current.baseToken.symbol}.`}
              className={styles.baseTokenShieldCallout}
            />
          )}
          {showLoadingPinEntryPanel && (
            <FullScreenSpinner text="Loading token..." />
          )}
        </>
      )}
      {isDefined(currentTokenToAdd) &&
        isDefined(requiresAddTokenDescription) && (
          <>
            <Text className={styles.addTokenDescription}>
              {requiresAddTokenDescription}
            </Text>
            <Button
              endIcon={IconType.Plus}
              children={`Add ${currentTokenToAdd.symbol} to wallet`}
              onClick={openAddTokenModal}
              buttonClassName={styles.addTokenButton}
              textClassName={styles.addTokenButtonText}
            />
          </>
        )}
      {!showAmountEntry && canSendMultipleTokens && (
        <Button
          endIcon={IconType.Plus}
          children="Another token"
          onClick={() => {
            setNumEntryString('');
            setShowAmountEntry(true);
            setCurrentToken(topPickToken);
          }}
          buttonClassName={styles.newTokenButton}
          textClassName={styles.bottomButtonLabel}
          disabled={isShieldView && hasOnlyBaseToken(tokenAmounts)}
        />
      )}
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
