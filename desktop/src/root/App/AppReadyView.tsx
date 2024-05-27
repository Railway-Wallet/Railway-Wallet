import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useMemo, useState } from 'react';
import { SidebarMenu } from '@components/SidebarMenu/SidebarMenu';
import { ToastWrapperView } from '@components/views/ToastWrapperView/ToastWrapperView';
import { useInactiveProviderPauser } from '@hooks/networking/useInactiveProviderPauser';
import { useVersionManager } from '@hooks/useVersionManager';
import {
  AppStatus,
  FrontendWallet,
  ProviderLoader,
  SharedConstants,
  StorageService,
  useReduxSelector,
  useWakuBroadcasterChainUpdater,
} from '@react-shared';
import { AppPasswordView } from '@screens/pages/app-password-view/AppPasswordView/AppPasswordView';
import { WalletProviderLoadingView } from '@screens/pages/wallets-provider-loading-view/WalletProviderLoadingView/WalletProviderLoadingView';
import { Constants } from '@utils/constants';
import { PPOIToastManager } from '@views/components/alerts/PPOIToastManager/PPOIToastManager';
import { AppIntroView } from '@views/screens/pages/app-intro-view/AppIntroView';
import { AppRouter } from './AppRouter';
import { AppRoutes } from './AppRoutes';
import styles from './App.module.scss';

type Props = {
  triggerAppStatus: (appStatus: AppStatus, err?: Error) => void;
};

export const AppReadyView: React.FC<Props> = ({ triggerAppStatus }) => {
  const { wallets } = useReduxSelector('wallets');

  const [hasAccessibleWallets, setHasAccessibleWallets] =
    useState<Optional<boolean>>(undefined);
  const [hasPassword, setHasPassword] = useState<Optional<boolean>>(undefined);
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [enteredPassword, setEnteredPassword] = useState(false);
  const [walletProviderNeedsLoad, setWalletProviderNeedsLoad] = useState(false);
  const [showAppIntro, setShowAppIntro] = useState(false);

  useWakuBroadcasterChainUpdater();
  useInactiveProviderPauser();
  const { VersionManagerAlert } = useVersionManager(triggerAppStatus);

  useEffect(() => {
    const checkNeedsPassword = async () => {
      const [storedHashOfHash, storedSalt] = await Promise.all([
        StorageService.getItem(Constants.PASSWORD_HASH_STORED),
        StorageService.getItem(Constants.PASSWORD_SALT),
      ]);
      setHasPassword(isDefined(storedHashOfHash) && isDefined(storedSalt));
    };

    const checkNeedsAppIntro = async () => {
      const hasSeen = await StorageService.getItem(
        SharedConstants.HAS_SEEN_APP_INTRO,
      );
      setShowAppIntro(!isDefined(hasSeen));
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkNeedsPassword();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkNeedsAppIntro();
  }, []);

  useEffect(() => {
    const checkHasAccessibleWallets = async () => {
      const [storedWallets, storedHashOfHash, storedSalt] = await Promise.all([
        StorageService.getItem(Constants.AVAILABLE_WALLETS),
        StorageService.getItem(Constants.PASSWORD_HASH_STORED),
        StorageService.getItem(Constants.PASSWORD_SALT),
      ]);
      setHasAccessibleWallets(
        isDefined(storedWallets) &&
          isDefined(storedHashOfHash) &&
          isDefined(storedSalt) &&
          storedWallets.length > 0,
      );
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkHasAccessibleWallets();
  }, [wallets]);

  const allWallets: FrontendWallet[] = [
    ...wallets.available,
    ...wallets.viewOnly,
  ];
  const pendingWalletLoad =
    (hasAccessibleWallets ?? false) && !allWallets.length;

  const firstProviderLoaded = ProviderLoader.firstProviderLoaded;

  useEffect(() => {
    if (pendingWalletLoad || !firstProviderLoaded) {
      setWalletProviderNeedsLoad(true);
    }
  }, [pendingWalletLoad, firstProviderLoaded]);

  const shouldShowPassword = (hasPassword ?? false) && !enteredPassword;
  const shouldShowWalletsProviderLoading =
    !shouldShowPassword &&
    walletProviderNeedsLoad &&
    (!(hasPassword ?? false) || isDefined(authKey));
  const shouldShowApp =
    !shouldShowPassword && !shouldShowWalletsProviderLoading;

  if (shouldShowApp && isDefined(authKey)) {
    setAuthKey(undefined);
  }

  const appReadyView = useMemo(() => {
    return (
      <>
        {shouldShowPassword && (
          <AppPasswordView
            success={authKey => {
              setAuthKey(authKey);
              setEnteredPassword(true);
            }}
          />
        )}
        {shouldShowWalletsProviderLoading && (
          <WalletProviderLoadingView
            authKey={authKey}
            loadComplete={() => {
              setWalletProviderNeedsLoad(false);
            }}
          />
        )}
        {shouldShowApp && (
          <>
            <AppRouter>
              <div className={styles.appContainer}>
                <SidebarMenu />
                <AppRoutes />
                <PPOIToastManager />
                <VersionManagerAlert />
              </div>
            </AppRouter>
            <ToastWrapperView />
            {showAppIntro && (
              <AppIntroView
                onComplete={async () => {
                  setShowAppIntro(false);
                  await StorageService.setItem(
                    SharedConstants.HAS_SEEN_APP_INTRO,
                    '1',
                  );
                }}
              />
            )}
          </>
        )}
      </>
    );
  }, [
    VersionManagerAlert,
    authKey,
    shouldShowApp,
    shouldShowPassword,
    shouldShowWalletsProviderLoading,
  ]);

  if (!isDefined(hasPassword)) {
    return null;
  }

  return appReadyView;
};
