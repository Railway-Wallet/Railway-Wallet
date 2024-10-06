import { ERC20Amount, ERC20Token } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { useTopPickERC20 } from "./useTopPickERC20";

export const useTopPickSwapERC20s = (
  isRailgun: boolean,
  navigationToken: Optional<ERC20Token>
) => {
  const transactionType = TransactionType.Swap;
  const sellTokenSkipAmounts: ERC20Amount[] = [];
  const { topPickToken: topPickSellToken } = useTopPickERC20(
    transactionType,
    navigationToken,
    isRailgun,
    sellTokenSkipAmounts
  );
  const buyTokenSkipAmounts: ERC20Amount[] = topPickSellToken
    ? [
        {
          token: topPickSellToken,
          amountString: "0",
        },
      ]
    : [];
  const { topPickToken: topPickBuyToken } = useTopPickERC20(
    transactionType,
    undefined,
    isRailgun,
    buyTokenSkipAmounts
  );

  return { topPickSellToken, topPickBuyToken };
};
