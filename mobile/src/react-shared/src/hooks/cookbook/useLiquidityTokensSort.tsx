import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { useMemo } from "react";
import { ERC20TokenFullInfo } from "../../models";
import { useERC20BalancesSerialized } from "../balances";

export const useLiquidityTokensSort = (
  liquidityTokens: Optional<ERC20TokenFullInfo[]>,
  isRailgun: boolean
) => {
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    isRailgun,
    balanceBucketFilter
  );

  const sortedLiquidityTokens = useMemo(() => {
    if (!isDefined(liquidityTokens)) return [];

    return liquidityTokens.sort((a, b) => {
      const balanceA = BigInt(
        tokenBalancesSerialized[a.address.toLowerCase()] ?? 0
      );
      const balanceB = BigInt(
        tokenBalancesSerialized[b.address.toLowerCase()] ?? 0
      );

      if (balanceA > balanceB) {
        return -1;
      } else if (balanceA < balanceB) {
        return 1;
      }

      return 0;
    });
  }, [liquidityTokens, tokenBalancesSerialized]);

  return { sortedLiquidityTokens };
};
