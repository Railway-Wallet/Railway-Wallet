import { RailgunWalletBalanceBucket } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import { PinEntryPanel } from '@components/inputs/PinEntryPanel/PinEntryPanel';
import { SendERC20sNumberInput } from '@components/views/ERC20AmountsNumPadView/SendERC20sNumberInput/SendERC20sNumberInput';
import {
  compareTokens,
  ERC20Amount,
  ERC20Token,
  formatUnitFromHexString,
  maxBalanceAvailableToShield,
  stringEntryToBigInt,
  TransactionType,
  useRailgunFees,
  useValidateNumEntry,
} from '@react-shared';
import { HapticSurface, triggerHaptic } from '@services/util/haptic-service';

export const useSendERC20sNumInput = (
  transactionType: TransactionType,
  error: Optional<Error>,
  setError: (err?: Error) => void,
  currentToken: Optional<ERC20Token>,
  tokenBalance: bigint,
  setShowAmountEntry: (value: boolean) => void,
  onTapTokenSelector: Optional<() => void>,
  erc20Amounts: ERC20Amount[],
  setTokenAmounts: (erc20Amounts: ERC20Amount[]) => void,
  tokenAllowance: Optional<bigint>,
  isRailgunBalance: boolean,
  balanceBucketFilter: RailgunWalletBalanceBucket[],
  requiresApproval: boolean,
  focused: boolean,
) => {
  const [numEntryString, setNumEntryString] = useState('');

  const { shieldFee } = useRailgunFees(transactionType);

  const { hasValidNumEntry, disableNumPad } = useValidateNumEntry(
    setError,
    numEntryString,
    tokenAllowance,
    requiresApproval,
    tokenBalance,
    transactionType,
    currentToken,
    isRailgunBalance,
  );

  const onTapPanelButton = (num: number) => {
    const newString = numEntryString + String(num);
    if (
      disableNumPad ||
      (newString === numEntryString && !(num === 0 && entryHasDecimal()))
    ) {
      return;
    }

    triggerHaptic(HapticSurface.NumPad);
    updateAmount(newString);
  };

  const entryHasDecimal = () => {
    return numEntryString.includes('.');
  };

  const onTapDecimalButton = () => {
    if (disableNumPad) {
      return;
    }
    if (entryHasDecimal()) {
      return;
    }
    if (!numEntryString.length) {
      const newString = '0.';
      triggerHaptic(HapticSurface.NumPad);
      updateAmount(newString);
      return;
    }
    const newString = numEntryString + '.';
    if (isNaN(Number(newString))) {
      return;
    }
    triggerHaptic(HapticSurface.NumPad);
    updateAmount(newString);
  };

  const onTapBackspaceButton = () => {
    if (disableNumPad) {
      return;
    }
    if (!numEntryString.length) {
      return;
    }
    const newString = numEntryString.slice(0, -1);
    triggerHaptic(HapticSurface.NumPad);
    updateAmount(newString);
  };

  const onTapMaxButton = () => {
    if (disableNumPad) {
      return;
    }
    if (!currentToken) {
      return;
    }

    let adjustedMaxAmount = tokenBalance;
    if (transactionType === TransactionType.Shield) {
      adjustedMaxAmount = maxBalanceAvailableToShield(tokenBalance, shieldFee);
    }

    const newString = formatUnitFromHexString(
      adjustedMaxAmount,
      currentToken.decimals,
    );
    triggerHaptic(HapticSurface.SelectItem);
    updateAmount(newString);
  };

  const onTapClearButton = () => {
    triggerHaptic(HapticSurface.SelectItem);
    updateAmount('');
  };

  const updateAmount = (amount: string) => {
    setNumEntryString(amount);
  };

  const onSaveAmount = () => {
    if (!currentToken) {
      return;
    }
    let updated = false;
    const savedTokenAmount: ERC20Amount = {
      token: currentToken,
      amountString: stringEntryToBigInt(
        numEntryString,
        currentToken.decimals,
      ).toString(),
    };
    const newTokenAmounts: ERC20Amount[] = [];
    for (const tokenAmount of erc20Amounts) {
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
    triggerHaptic(HapticSurface.SelectItem);
    setTokenAmounts(newTokenAmounts);
    setShowAmountEntry(false);
  };

  return {
    numEntryString,
    setNumEntryString,
    sendTokenNumberInput: (
      <SendERC20sNumberInput
        focused={focused}
        token={currentToken}
        error={error}
        onSaveAmount={onSaveAmount}
        numEntryString={numEntryString}
        updateAmount={updateAmount}
        onTapMaxButton={onTapMaxButton}
        transactionType={transactionType}
        onTapClearButton={onTapClearButton}
        hasValidNumEntry={hasValidNumEntry}
        isRailgunBalance={isRailgunBalance}
        balanceBucketFilter={balanceBucketFilter}
        onTapTokenSelector={onTapTokenSelector}
      />
    ),
    pinEntryPanel: (
      <PinEntryPanel
        addDecimalEntry
        onTapPanelButton={onTapPanelButton}
        onTapDecimalButton={onTapDecimalButton}
        enteredPinLength={numEntryString.length}
        onTapBackspaceButton={onTapBackspaceButton}
      />
    ),
  };
};
