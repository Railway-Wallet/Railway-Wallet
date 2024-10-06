import {
  RailgunWalletBalanceBucket,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { useMemo } from "react";
import { ERC20Amount, ERC20AmountRecipient } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { getTokenBalanceSerialized } from "../../utils/tokens";
import { adjustERC20AmountRecipientForTransaction } from "../../utils/transactions";
import { useERC20BalancesSerialized } from "../balances/useERC20BalancesSerialized";
import { useRailgunFees } from "../formatting/useRailgunFees";

export const useAdjustERC20AmountRecipientsForTransaction = (
  erc20AmountRecipients: ERC20AmountRecipient[],
  transactionType: TransactionType,
  isFullyPrivateTransaction: boolean,
  gasDetails: Optional<TransactionGasDetails>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  sendWithPublicWallet: boolean
) => {
  const { shieldFee, unshieldFee } = useRailgunFees(
    transactionType,
    isFullyPrivateTransaction
  );

  const useRailgunBalances =
    isFullyPrivateTransaction || transactionType === TransactionType.Unshield;

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    useRailgunBalances,
    balanceBucketFilter
  );

  const adjustedERC20AmountRecipients = useMemo(() => {
    return erc20AmountRecipients.map((erc20AmountRecipient) => {
      const { token } = erc20AmountRecipient;
      const tokenBalanceSerialized = getTokenBalanceSerialized(
        token,
        tokenBalancesSerialized
      );

      return adjustERC20AmountRecipientForTransaction(
        erc20AmountRecipient,
        transactionType,
        isFullyPrivateTransaction,
        gasDetails,
        broadcasterFeeERC20Amount,
        shieldFee,
        unshieldFee,
        tokenBalanceSerialized,
        sendWithPublicWallet
      );
    });
  }, [
    erc20AmountRecipients,
    tokenBalancesSerialized,
    transactionType,
    isFullyPrivateTransaction,
    gasDetails,
    broadcasterFeeERC20Amount,
    shieldFee,
    unshieldFee,
    sendWithPublicWallet,
  ]);

  return { adjustedERC20AmountRecipients };
};
