import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { useMemo } from "react";
import { useERC20BalancesSerialized } from "../balances";
import { FrontendLiquidityPair } from "./useLiquidityPairsForWalletFilter";

export const useLiquidityPairsSort = (
  liquidityPairs: Optional<FrontendLiquidityPair[]>,
  isRailgun: boolean
) => {
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    isRailgun,
    balanceBucketFilter
  );

  const sortedLiquidityPairs = useMemo(() => {
    if (!isDefined(liquidityPairs)) return [];

    return liquidityPairs.sort((pair1, pair2) => {
      const pair1BalanceA =
        tokenBalancesSerialized[pair1.tokenA.address.toLowerCase()];
      const pair1BalanceB =
        tokenBalancesSerialized[pair1.tokenB.address.toLowerCase()];
      const pair2BalanceA =
        tokenBalancesSerialized[pair2.tokenA.address.toLowerCase()];
      const pair2BalanceB =
        tokenBalancesSerialized[pair2.tokenB.address.toLowerCase()];

      const hasPair1BalanceA =
        isDefined(pair1BalanceA) && BigInt(pair1BalanceA) > 0n;
      const hasPair1BalanceB =
        isDefined(pair1BalanceB) && BigInt(pair1BalanceB) > 0n;
      const hasPair2BalanceA =
        isDefined(pair2BalanceA) && BigInt(pair2BalanceA) > 0n;
      const hasPair2BalanceB =
        isDefined(pair2BalanceB) && BigInt(pair2BalanceB) > 0n;

      const pair1TotalBalance =
        hasPair1BalanceA && hasPair1BalanceB
          ? BigInt(pair1BalanceA) + BigInt(pair1BalanceB)
          : undefined;
      const pair2TotalBalance =
        hasPair2BalanceA && hasPair2BalanceB
          ? BigInt(pair2BalanceA) + BigInt(pair2BalanceB)
          : undefined;

      if (isDefined(pair1TotalBalance) && isDefined(pair2TotalBalance)) {
        if (pair1TotalBalance > pair2TotalBalance) {
          return -1;
        } else if (pair1TotalBalance < pair2TotalBalance) {
          return 1;
        }
      } else if (
        isDefined(pair1TotalBalance) &&
        !isDefined(pair2TotalBalance)
      ) {
        return -1;
      } else if (
        !isDefined(pair1TotalBalance) &&
        isDefined(pair2TotalBalance)
      ) {
        return 1;
      }

      return 0;
    });
  }, [liquidityPairs, tokenBalancesSerialized]);

  return { sortedLiquidityPairs };
};
