import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useMemo, useState } from "react";
import { SendERC20sNumberInput } from "@components/views/ERC20AmountsNumPadView/SendERC20sNumberInput/SendERC20sNumberInput";
import {
  compareTokens,
  ERC20Amount,
  ERC20Token,
  formatEntryAmountWithFeesIfNeeded,
  formatUnitFromHexString,
  maxBalanceAvailableToShield,
  TransactionType,
  useRailgunFees,
  useValidateNumEntry,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";

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
  singleFeeChecked: boolean,
  bothFeesChecked: boolean
) => {
  const [numEntryString, setNumEntryString] = useState("");
  const isShieldView = transactionType === TransactionType.Shield;
  const isUnshieldView = transactionType === TransactionType.Unshield;

  const { shieldFee, unshieldFee } = useRailgunFees(transactionType);

  const { finalEntryBigInt, finalEntryString } = useMemo(() => {
    if (!isDefined(currentToken)) {
      return { finalEntryBigInt: 0n, finalEntryString: "" };
    }

    const addShieldFee = (singleFeeChecked && isShieldView) || bothFeesChecked;
    const addUnshieldFee =
      (singleFeeChecked && isUnshieldView) || bothFeesChecked;
    const { finalEntryBigInt, finalEntryString } =
      formatEntryAmountWithFeesIfNeeded(
        numEntryString,
        currentToken.decimals,
        addShieldFee ? shieldFee : undefined,
        addUnshieldFee ? unshieldFee : undefined
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
    tokenAllowance,
    requiresApproval,
    tokenBalance,
    transactionType,
    currentToken,
    isRailgunBalance
  );

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
      currentToken.decimals
    );
    triggerHaptic(HapticSurface.SelectItem);
    updateAmount(newString);
  };

  const onTapClearButton = () => {
    triggerHaptic(HapticSurface.SelectItem);
    updateAmount("");
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
      amountString: finalEntryBigInt.toString(),
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
    finalEntryBigInt,
    finalEntryString,
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
  };
};
