import { TransactionGasDetails } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { formatUnits } from "ethers";
import { ERC20Amount, ERC20AmountRecipient } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { getTokenBalanceSerialized } from "../../utils/tokens";
import { adjustERC20AmountRecipientForTransaction } from "../../utils/transactions";
import { useERC20BalancesSerialized } from "../balances/useERC20BalancesSerialized";

export const usePublicSwapAdjustedSellERC20Amount = (
  sellERC20AmountRecipient: Optional<ERC20AmountRecipient>,
  gasDetails: Optional<TransactionGasDetails>
) => {
  const isRailgun = false;
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(isRailgun, []);

  const sellERC20AmountRecipientAmount = sellERC20AmountRecipient?.amountString;
  const sellERC20AmountRecipientTokenAddress =
    sellERC20AmountRecipient?.token.address;
  const {
    sellERC20AmountAdjusted,
    finalSellTokenAmount,
  }: {
    sellERC20AmountAdjusted: Optional<ERC20AmountRecipient>;
    finalSellTokenAmount: Optional<ERC20Amount>;
  } = useMemo(() => {
    if (!sellERC20AmountRecipient) {
      return {
        sellERC20AmountAdjusted: undefined,
        finalSellTokenAmount: undefined,
      };
    }

    const { token } = sellERC20AmountRecipient;
    const tokenBalanceSerialized = getTokenBalanceSerialized(
      token,
      tokenBalancesSerialized
    );

    const adjustedAmounts = adjustERC20AmountRecipientForTransaction(
      sellERC20AmountRecipient,
      TransactionType.Send,
      isRailgun,
      gasDetails,
      undefined,
      "undefined",
      "undefined",
      tokenBalanceSerialized,
      false
    );

    const finalSellTokenAmount: ERC20Amount = {
      token: adjustedAmounts.output.token,
      amountString: adjustedAmounts.output.amountString,
    };

    return {
      sellERC20AmountAdjusted: adjustedAmounts.output,
      finalSellTokenAmount,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sellERC20AmountRecipientTokenAddress,
    sellERC20AmountRecipientAmount,
    tokenBalancesSerialized,
    gasDetails,
  ]);

  const sellERC20AmountAdjustedText: Optional<string> = useMemo(() => {
    if (!sellERC20AmountAdjusted) {
      return undefined;
    }
    const adjustedAmount = BigInt(sellERC20AmountAdjusted.amountString);
    return formatUnits(adjustedAmount, sellERC20AmountAdjusted.token.decimals);
  }, [sellERC20AmountAdjusted]);

  return {
    sellERC20AmountAdjusted,
    sellERC20AmountAdjustedText,
    finalSellTokenAmount,
  };
};
