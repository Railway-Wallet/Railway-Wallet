import { BeefyAPI } from "@railgun-community/cookbook";
import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { useEffect, useState } from "react";
import { SharedConstants } from "../../config";
import { Vault } from "../../models/vault";
import {
  DepositVaultsState,
  updateVaults,
} from "../../redux-store/reducers/vaults-reducer";
import { logDevError } from "../../utils";
import { fetchBeefyVaults } from "../../utils/vaults-util";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";

export const useVaultFetch = () => {
  const { network } = useReduxSelector("network");
  const { vaults } = useReduxSelector("vaults");
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [vaultFetchError, setVaultFetchError] =
    useState<Optional<Error>>(undefined);

  const refreshVaultData = async (
    networkName: NetworkName,
    skipCache: boolean
  ) => {
    setVaultFetchError(undefined);
    if (!BeefyAPI.supportsNetwork(networkName)) {
      return;
    }

    setIsLoading(true);
    try {
      const beefyVaults = await fetchBeefyVaults(networkName, skipCache);

      const networkVaults: Vault[] = [...beefyVaults];

      const depositVaultsForTokenMap: MapType<DepositVaultsState> = {};
      const redeemVaultForTokenMap: MapType<Vault> = {};
      for (const v of networkVaults) {
        const depositAddress = v.depositERC20Address.toLowerCase();

        const depositVault = depositVaultsForTokenMap[depositAddress];

        if (!isDefined(depositVault)) {
          depositVaultsForTokenMap[depositAddress] = {
            list: [v],
            bestApy: v.apy,
          };
        } else {
          depositVault.list.push(v);
          const bestApy = depositVault.bestApy;
          depositVault.bestApy = Math.max(bestApy, v.apy);
        }

        redeemVaultForTokenMap[v.redeemERC20Address.toLowerCase()] = v;
      }

      Object.values(depositVaultsForTokenMap).forEach((tokenVaults) => {
        tokenVaults?.list.sort((v1, v2) => v2.apy - v1.apy);
      });

      dispatch(
        updateVaults({
          networkName,
          depositVaultsForTokenMap,
          redeemVaultForTokenMap,
        })
      );
    } catch (err) {
      const error = new Error("Error refreshing vault data", {
        cause: err,
      });
      logDevError(error);
      setVaultFetchError(error);
    }

    setIsLoading(false);
  };

  const refreshVaultDataIfStale = async () => {
    const networkName = network.current.name;
    const lastUpdated = vaults.forNetwork[network.current.name]?.updatedAt ?? 0;
    const timeSinceUpdateMs = Date.now() - lastUpdated;
    const thresholdMs = 3 * 60 * 1000;
    const isStale = timeSinceUpdateMs > thresholdMs;

    if (isStale) {
      await refreshVaultData(networkName, false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshVaultDataIfStale();

    const updateInterval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refreshVaultDataIfStale();
    }, SharedConstants.PULL_VAULTS_INTERVAL);

    return () => {
      clearInterval(updateInterval);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.current.name]);

  return {
    refreshVaultData,
    isLoading,
    vaultFetchError,
  };
};
