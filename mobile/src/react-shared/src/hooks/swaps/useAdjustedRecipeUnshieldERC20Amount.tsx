import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { formatUnits } from "ethers";
import { ERC20Amount, ERC20AmountRecipient } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { getTokenBalanceSerialized } from "../../utils/tokens";
import { adjustERC20AmountRecipientForTransaction } from "../../utils/transactions";
import { useERC20BalancesSerialized } from "../balances/useERC20BalancesSerialized";
import { useRailgunFees } from "../formatting/useRailgunFees";

export const useAdjustedRecipeUnshieldERC20Amount = (
  inputERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>
) => {
  const isRailgun = true;
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    isRailgun,
    balanceBucketFilter
  );

  const transactionType = TransactionType.Swap;
  const { shieldFee, unshieldFee } = useRailgunFees(transactionType, isRailgun);

  const inputERC20AmountRecipientAmount =
    inputERC20AmountRecipient?.amountString;
  const inputERC20AmountRecipientTokenAddress =
    inputERC20AmountRecipient?.token.address;
  const {
    unshieldERC20AmountAdjusted,
  }: {
    unshieldERC20AmountAdjusted: Optional<ERC20AmountRecipient>;
  } = useMemo(() => {
    if (!inputERC20AmountRecipient) {
      return {
        unshieldERC20AmountAdjusted: undefined,
        finalInputTokenAmountRecipient: undefined,
      };
    }

    const { token } = inputERC20AmountRecipient;
    const tokenBalanceSerialized = getTokenBalanceSerialized(
      token,
      tokenBalancesSerialized
    );

    const adjustedAmounts = adjustERC20AmountRecipientForTransaction(
      inputERC20AmountRecipient,
      TransactionType.Unshield,
      isRailgun,
      undefined,
      broadcasterFeeERC20Amount,
      shieldFee,
      unshieldFee,
      tokenBalanceSerialized,
      false
    );

    const adjustedInputValue = BigInt(adjustedAmounts.output.amountString);
    const adjustedAmountsFeeValue = BigInt(adjustedAmounts.fee.amountString);

    const unshieldERC20AmountAdjusted: ERC20AmountRecipient = {
      token: adjustedAmounts.output.token,
      amountString: (adjustedInputValue + adjustedAmountsFeeValue).toString(),
      recipientAddress: inputERC20AmountRecipient.recipientAddress,
      externalUnresolvedToWalletAddress:
        inputERC20AmountRecipient.externalUnresolvedToWalletAddress,
    };

    return {
      unshieldERC20AmountAdjusted,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shieldFee,
    unshieldFee,
    isRailgun,
    inputERC20AmountRecipientTokenAddress,
    inputERC20AmountRecipientAmount,
    tokenBalancesSerialized,
    broadcasterFeeERC20Amount,
  ]);

  const unshieldERC20AmountAdjustedText: Optional<string> = useMemo(() => {
    if (!unshieldERC20AmountAdjusted) {
      return undefined;
    }
    const adjustedAmount = BigInt(unshieldERC20AmountAdjusted.amountString);
    return formatUnits(
      adjustedAmount,
      unshieldERC20AmountAdjusted.token.decimals
    );
  }, [unshieldERC20AmountAdjusted]);

  return {
    unshieldERC20AmountAdjusted,
    unshieldERC20AmountAdjustedText,
  };
};
