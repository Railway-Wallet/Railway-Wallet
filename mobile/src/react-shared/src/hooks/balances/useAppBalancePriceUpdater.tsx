import { RailgunBalanceRefreshTrigger } from "@railgun-community/shared-models";
import { useEffect } from "react";
import { SharedConstants } from "../../config/shared-constants";
import { useAppDispatch, useReduxSelector } from "../hooks-redux";
import { useBalancePriceRefresh } from "./useBalancePriceRefresh";

export const useAppBalancePriceUpdater = (
  railBalanceRefreshTrigger: RailgunBalanceRefreshTrigger,
  setError: (error: Error) => void
) => {
  const { wallets } = useReduxSelector("wallets");
  const { remoteConfig } = useReduxSelector("remoteConfig");

  const dispatch = useAppDispatch();

  const { pullPrices, pullBalances } = useBalancePriceRefresh(
    railBalanceRefreshTrigger,
    setError
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    pullPrices();

    if (!wallets.active || !(wallets.active.isRailgunWalletLoaded ?? false)) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    pullBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, pullBalances, pullPrices, remoteConfig]);

  useEffect(() => {
    const timerPrices = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pullPrices();
    }, SharedConstants.PULL_PRICES_INTERVAL);
    const timerBalances = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      pullBalances();
    }, SharedConstants.PULL_BALANCES_INTERVAL);

    return () => {
      clearInterval(timerPrices);
      clearInterval(timerBalances);
    };
  }, [pullBalances, pullPrices]);
};
