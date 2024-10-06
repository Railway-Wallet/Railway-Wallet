import { LiquidityV2Pool, UniswapV2Fork } from "@railgun-community/cookbook";
import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { useMemo } from "react";
import {
  compareTokenAddress,
  convertSerializedToLiquidityPool,
} from "../../utils";
import { useReduxSelector } from "../hooks-redux";
import { FrontendLiquidityPair } from "./useLiquidityPairsForWalletFilter";

const liquidityPoolDataSorter = (
  a: LiquidityV2Pool,
  b: LiquidityV2Pool
): number => {
  if (
    a.uniswapV2Fork === UniswapV2Fork.Uniswap &&
    b.uniswapV2Fork !== UniswapV2Fork.Uniswap
  ) {
    return -1;
  } else if (
    a.uniswapV2Fork !== UniswapV2Fork.Uniswap &&
    b.uniswapV2Fork === UniswapV2Fork.Uniswap
  ) {
    return 1;
  }
  return 0;
};

export const useLiquidityPoolsForPairFilter = (
  liquidityPair: FrontendLiquidityPair,
  networkName: NetworkName
) => {
  const { liquidity } = useReduxSelector("liquidity");
  const liquidityPoolsForNetwork = liquidity.forNetwork[networkName]?.allPools;

  const tokenAddressA = liquidityPair.tokenA.address;
  const tokenAddressB = liquidityPair.tokenB.address;

  const { filteredLiquidityPoolList } = useMemo(() => {
    let liquidityPoolList: LiquidityV2Pool[] = [];

    if (!isDefined(liquidityPoolsForNetwork)) {
      return {
        filteredLiquidityPoolList: liquidityPoolList,
      };
    }

    liquidityPoolList = liquidityPoolsForNetwork
      .map(convertSerializedToLiquidityPool)
      .filter(
        (lp) =>
          compareTokenAddress(lp.tokenAddressA, tokenAddressA) &&
          compareTokenAddress(lp.tokenAddressB, tokenAddressB)
      );

    liquidityPoolList.sort(liquidityPoolDataSorter);

    return {
      filteredLiquidityPoolList: liquidityPoolList,
    };
  }, [tokenAddressA, tokenAddressB, liquidityPoolsForNetwork]);

  return {
    liquidityPoolList: filteredLiquidityPoolList,
  };
};
