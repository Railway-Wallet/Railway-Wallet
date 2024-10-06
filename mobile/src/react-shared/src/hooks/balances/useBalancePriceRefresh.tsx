import {
  Chain,
  isDefined,
  Network,
  RailgunBalanceRefreshTrigger,
} from "@railgun-community/shared-models";
import { useCallback, useRef, useState } from "react";
import { FrontendWallet } from "../../models/wallet";
import { pullWalletBalancesNetwork } from "../../services/wallet/wallet-balance-service";
import { pullERC20TokenPricesForNetwork } from "../../services/wallet/wallet-price-service";
import { logDevError } from "../../utils";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";

export type PullPrices = (
  forceWallet?: FrontendWallet,
  forceNetwork?: Network
) => Promise<void>;

export type PullBalances = (
  forceWallet?: FrontendWallet,
  forceNetwork?: Network
) => Promise<[void, void]>;

export const useBalancePriceRefresh = (
  railgunBalanceRefreshTrigger: RailgunBalanceRefreshTrigger,
  setError: (error: Error) => void
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const dispatch = useAppDispatch();
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const refreshBalancesPromiseMap = useRef<MapType<Promise<[void, void]>>>({});

  const currentPullBalanceWalletID = useRef<Optional<string>>();

  const refreshRailgunBalances = useCallback(
    async (forceChain?: Chain) => {
      if (!wallets.active || !(wallets.active.isRailgunWalletLoaded ?? false)) {
        return;
      }
      try {
        await railgunBalanceRefreshTrigger(
          forceChain ?? network.current.chain,
          [wallets.active.railWalletID]
        );
      } catch (cause) {
        if (!(cause instanceof Error)) {
          throw new Error("Unexpected non-error thrown", { cause });
        }
        if (cause.message.includes("provider destroyed")) return;
        const error = new Error("Error refreshing Railgun balances", { cause });
        logDevError(error);
        setError(error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      wallets.active?.id,
      wallets.active?.isRailgunWalletLoaded,
      wallets.active?.addedTokens,
      dispatch,
      network.current.name,
      railgunBalanceRefreshTrigger,
    ]
  );

  const pullPrices: PullPrices = useCallback(
    async (forceWallet?: FrontendWallet, forceNetwork?: Network) => {
      if (isRefreshingPrices) {
        return;
      }
      setIsRefreshingPrices(true);
      const wallet = forceWallet ?? wallets.active;
      await pullERC20TokenPricesForNetwork(
        dispatch,
        wallet,
        forceNetwork ?? network.current
      );
      setIsRefreshingPrices(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      wallets.active?.id,
      wallets.active?.addedTokens,
      dispatch,
      network.current.name,
    ]
  );

  const pullBalances: PullBalances = useCallback(
    (
      forceWallet?: FrontendWallet,
      forceNetwork?: Network
    ): Promise<[void, void]> => {
      const wallet = forceWallet ?? wallets.active;
      const isDifferentWallet =
        currentPullBalanceWalletID.current !== wallet?.railWalletID;
      const networkName = forceNetwork?.name ?? network.current.name;
      const currentPromise = refreshBalancesPromiseMap.current[networkName];
      if (!isDifferentWallet && isDefined(currentPromise)) {
        return currentPromise;
      }
      currentPullBalanceWalletID.current = wallet?.railWalletID;
      const promise = Promise.all([
        pullWalletBalancesNetwork(
          dispatch,
          wallet,
          forceNetwork ?? network.current
        ),
        refreshRailgunBalances(forceNetwork?.chain),
      ]);
      refreshBalancesPromiseMap.current[networkName] = promise;
      return promise.finally(() => {
        refreshBalancesPromiseMap.current[networkName] = undefined;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshRailgunBalances]
  );

  return { pullPrices, pullBalances };
};
