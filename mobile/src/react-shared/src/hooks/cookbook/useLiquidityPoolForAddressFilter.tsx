import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { useMemo } from "react";
import {
  compareTokenAddress,
  convertSerializedToLiquidityPool,
} from "../../utils";
import { useReduxSelector } from "../hooks-redux";

export const useLiquidityPoolForAddressFilter = (
  poolAddress: Optional<string>,
  networkName: NetworkName
) => {
  const { liquidity } = useReduxSelector("liquidity");
  const liquidityPoolsForNetwork = liquidity.forNetwork[networkName]?.allPools;

  const { liquidityPool } = useMemo(() => {
    if (!isDefined(liquidityPoolsForNetwork) || !isDefined(poolAddress)) {
      return {
        liquidityPool: undefined,
      };
    }

    const filteredLiquidityPool = liquidityPoolsForNetwork
      .map(convertSerializedToLiquidityPool)
      .find((lp) => compareTokenAddress(lp.pairAddress, poolAddress));

    return {
      liquidityPool: filteredLiquidityPool,
    };
  }, [poolAddress, liquidityPoolsForNetwork]);

  return {
    liquidityPool,
  };
};
