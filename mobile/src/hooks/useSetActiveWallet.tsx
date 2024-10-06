import { useCallback, useEffect, useState } from "react";
import {
  FrontendWallet,
  getWalletTransactionHistory,
  logDevError,
  RailgunTransactionHistorySync,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  useReduxSelector,
  WalletService,
  WalletStorageService,
} from "@react-shared";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";

export const useSetActiveWallet = (
  updateWallet?: (wallet: Optional<FrontendWallet>) => void
) => {
  const { network } = useReduxSelector("network");
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActiveWallet, setPendingActiveWallet] =
    useState<Optional<FrontendWallet>>();

  const setActiveWallet = useCallback(
    async (wallet?: FrontendWallet) => {
      if (!wallet || wallet.isActive) {
        return;
      }

      setIsLoading(true);

      try {
        const walletService = new WalletService(
          dispatch,
          new WalletSecureServiceReactNative()
        );
        const walletStorageService = new WalletStorageService(dispatch);
        const newWallet: FrontendWallet = { ...wallet, isActive: true };
        await walletService.loadRailgunWalletForFrontendWallet(newWallet);
        await walletStorageService.setActiveWallet(newWallet, network.current);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        RailgunTransactionHistorySync.safeSyncTransactionHistory(
          dispatch,
          network.current,
          getWalletTransactionHistory
        );

        if (updateWallet) {
          updateWallet(newWallet);
        }
      } catch (cause) {
        logDevError(new Error("Error selecting wallet", { cause }));
        dispatch(
          showImmediateToast({
            message: `Error selecting wallet: ${cause.message}`,
            type: ToastType.Error,
          })
        );
      }

      setIsLoading(false);
    },
    [dispatch, network, updateWallet]
  );

  useEffect(() => {
    if (pendingActiveWallet) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      setActiveWallet(pendingActiveWallet);
      setPendingActiveWallet(undefined);
    }
  }, [pendingActiveWallet, setActiveWallet]);

  return {
    setActiveWallet,
    isLoading,
    setIsLoading,
  };
};
