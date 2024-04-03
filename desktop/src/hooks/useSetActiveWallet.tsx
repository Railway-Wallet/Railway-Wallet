import { isDefined } from '@railgun-community/shared-models';
import { useCallback, useEffect, useState } from 'react';
import {
  FrontendWallet,
  getWalletTransactionHistory,
  RailgunTransactionHistorySync,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  useReduxSelector,
  WalletService,
  WalletStorageService,
} from '@react-shared';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';

export const useSetActiveWallet = (
  updateWallet?: (wallet: Optional<FrontendWallet>) => void,
) => {
  const { network } = useReduxSelector('network');

  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [pendingActiveWallet, setPendingActiveWallet] =
    useState<Optional<FrontendWallet>>();
  const [showEnterPassword, setShowEnterPassword] = useState(false);
  const [authKey, setAuthKey] = useState<Optional<string>>();

  const setActiveWallet = useCallback(
    async (wallet?: FrontendWallet) => {
      if (!wallet || wallet.isActive) {
        return;
      }

      setIsLoading(true);

      try {
        const newWallet: FrontendWallet = {
          ...wallet,
          isActive: true,
        };

        if (!(wallet.isRailgunWalletLoaded ?? false)) {
          if (!isDefined(authKey)) {
            setAuthKey(undefined);
            setPendingActiveWallet(wallet);
            setShowEnterPassword(true);
            setIsLoading(false);
            return;
          }
          const walletService = new WalletService(
            dispatch,
            new WalletSecureStorageWeb(authKey),
          );
          await walletService.loadRailgunWalletForFrontendWallet(newWallet);
        }
        const walletStorageService = new WalletStorageService(dispatch);
        await walletStorageService.setActiveWallet(newWallet, network.current);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        RailgunTransactionHistorySync.safeSyncTransactionHistory(
          dispatch,
          network.current,
          getWalletTransactionHistory,
        );
        setAuthKey(undefined);
        if (updateWallet) {
          updateWallet(newWallet);
        }
      } catch (err) {
        dispatch(
          showImmediateToast({
            message: `Error selecting wallet: ${err.message}`,
            type: ToastType.Error,
          }),
        );
      }

      setIsLoading(false);
    },
    [authKey, dispatch, network, updateWallet],
  );

  useEffect(() => {
    if (isDefined(authKey) && isDefined(pendingActiveWallet)) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      setActiveWallet(pendingActiveWallet);
      setPendingActiveWallet(undefined);
    }
  }, [authKey, pendingActiveWallet, setActiveWallet]);

  return {
    setActiveWallet,
    showEnterPassword,
    setShowEnterPassword,
    authKey,
    setAuthKey,
    isLoading,
    setIsLoading,
  };
};
