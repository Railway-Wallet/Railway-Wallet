import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { useCallback, useEffect, useState } from "react";
import { ERC20TokenFullInfo } from "../../models";
import { fetchLiquidity, logDevError } from "../../utils";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";

export const useLiquidityFetch = () => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [liquidityFetchError, setLiquidityFetchError] =
    useState<Optional<Error>>(undefined);

  const addedTokens = wallets.active?.addedTokens[network.current.name];

  const refreshLiquidityData = useCallback(
    async (
      networkName: NetworkName,
      walletTokens: Optional<ERC20TokenFullInfo[]>
    ) => {
      if (!isDefined(walletTokens)) return;

      setLiquidityFetchError(undefined);
      setIsLoading(true);
      try {
        const tokenAddresses = walletTokens.map((t) => t.address);
        await fetchLiquidity(networkName, tokenAddresses, dispatch);
      } catch (err) {
        const error = new Error("Error refreshing liquidity data", {
          cause: err,
        });
        logDevError(error);
        setLiquidityFetchError(error);
      }

      setIsLoading(false);
    },
    [dispatch]
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshLiquidityData(network.current.name, addedTokens);
  }, [addedTokens, refreshLiquidityData, network]);

  return {
    refreshLiquidityData,
    isLoading,
    liquidityFetchError,
  };
};
