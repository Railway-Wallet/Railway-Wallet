import {
  isDefined,
  Network,
  NETWORK_CONFIG,
  NetworkName,
} from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  delay,
  getWalletTransactionHistory,
  logDev,
  NetworkService,
  NetworkStoredSettingsService,
  ProviderLoader,
  ProviderNodeType,
  ProviderService,
  RailgunTransactionHistorySync,
  ReactConfig,
  refreshRailgunBalances,
  setNetworkByName,
  SettingsForNetwork,
  useAppDispatch,
  useReduxSelector,
  WalletService,
  WalletStorageService,
  WalletTokenService,
} from '@react-shared';
import { ErrorDetailsModal } from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { RecoveryWalletsModal } from '@screens/modals/recovery/RecoveryWalletsModal/RecoveryWalletsModal';
import { IconType } from '@services/util/icon-service';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';
import { Constants } from '@utils/constants';
import { ProgressBar } from '@views/components/ProgressBar/ProgressBar';
import styles from './WalletProviderLoadingView.module.scss';

const CHECK_PROVIDER_LOADED_DELAY = 100;

type Props = {
  authKey?: string;
  loadComplete: () => void;
};

export const WalletProviderLoadingView: React.FC<Props> = ({
  authKey,
  loadComplete,
}) => {
  const { network } = useReduxSelector('network');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [progress, setProgress] = useState(0);
  const [hasWallets, setHasWallets] = useState<boolean>(false);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const [showRecoveryMode, setShowRecoveryMode] = useState(false);

  const dispatch = useAppDispatch();
  const [error, setError] = useState<Optional<Error>>();

  const [networkStoredSettings, setNetworkStoredSettings] =
    useState<Optional<SettingsForNetwork>>();

  useEffect(() => {
    const checkWallets = async () => {
      const walletStorageService = new WalletStorageService(dispatch);
      const storedWallets = await walletStorageService.fetchStoredWallets();
      if (storedWallets.length > 0) {
        setHasWallets(true);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkWallets();

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadNetworkAndWallets(network.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const updateNetwork = async () => {
      const storedSettings =
        await NetworkStoredSettingsService.getSettingsForNetwork(
          network.current.name,
        );
      setNetworkStoredSettings(storedSettings);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateNetwork();
  }, [network, network.current.name]);

  const useDefaultRailwayRPCs = async () => {
    if (!networkStoredSettings) {
      return;
    }
    const updatedSettings: SettingsForNetwork =
      NetworkStoredSettingsService.defaultSettingsForNetwork();
    await NetworkStoredSettingsService.storeSettingsForNetwork(
      network.current.name,
      updatedSettings,
    );
    await ProviderService.loadFrontendProviderForNetwork(
      network.current.name,
      ProviderNodeType.FullNode,
    );
    setNetworkStoredSettings(updatedSettings);
    await retryLoadProviderAndWallets();
  };

  const updateProgress = (amount: number) => {
    setProgress(amount);
  };

  const waitForProviderToLoad = async (): Promise<boolean> => {
    if (ProviderLoader.firstProviderLoaded) {
      return true;
    } else if (isDefined(ProviderLoader.firstProviderLoadError)) {
      return false;
    }
    await delay(CHECK_PROVIDER_LOADED_DELAY);
    return waitForProviderToLoad();
  };

  const reloadProvider = async (loadNetwork: Network) => {
    const feesSerialized = await ProviderLoader.loadEngineProvider(
      loadNetwork.name,
      dispatch,
    );
    const networkService = new NetworkService(dispatch);
    await networkService.selectNetwork(loadNetwork.name, feesSerialized);
  };

  const loadNetworkAndWallets = async (loadNetwork: Network) => {
    try {
      const initialProgressLoadWallets = 25;
      const finalProgressLoadWallets = 95;

      updateProgress(5);
      const loaded = await waitForProviderToLoad();
      if (!loaded) {
        setError(
          new Error(
            `Error connecting to ${network.current.shortPublicName} network`,
            { cause: ProviderLoader.firstProviderLoadError },
          ),
        );
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        reloadProvider(loadNetwork);
        return;
      }

      if (!isDefined(authKey)) {
        logDev('No auth key - not loading any wallets.');
        updateProgress(finalProgressLoadWallets);
        loadComplete();
        return;
      }

      updateProgress(initialProgressLoadWallets);

      const walletService = new WalletService(
        dispatch,
        new WalletSecureStorageWeb(authKey),
      );

      const hasWallets = await walletService.loadWalletsFromStorage(
        network.current,
        (walletLoadProgress: number) => {
          updateProgress(
            (walletLoadProgress *
              (finalProgressLoadWallets - initialProgressLoadWallets)) /
              100 +
              initialProgressLoadWallets,
          );
        },
      );
      updateProgress(finalProgressLoadWallets);

      if (hasWallets) {
        const walletTokenService = new WalletTokenService(dispatch);
        await walletTokenService.addTokensForWalletsIfNeeded(loadNetwork.name);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        RailgunTransactionHistorySync.resyncAllTransactionsIfNecessary(
          dispatch,
          network.current,
          getWalletTransactionHistory,
          refreshRailgunBalances,
          Constants.REFRESH_TX_HISTORY_EVERY_LOAD_IN_DEV,
        );
      }
      updateProgress(100);
      loadComplete();
    } catch (cause) {
      setError(
        new Error(`Could not load Railway wallets and networks.`, { cause }),
      );
    }
  };

  const deleteWallets_DevOnly = async () => {
    if (!ReactConfig.IS_DEV) {
      return;
    }
    if (!isDefined(authKey)) {
      logDev('No auth key - not deleting any wallets.');
      return;
    }

    const walletService = new WalletService(
      dispatch,
      new WalletSecureStorageWeb(authKey),
    );
    await walletService.clearAllWallets();
  };

  const defaultNetworkName = NetworkService.getDefaultNetworkName();
  const defaultNetwork = NETWORK_CONFIG[defaultNetworkName];

  const switchToDefaultNetwork = async () => {
    dispatch(setNetworkByName(defaultNetworkName));
    await retryLoadProviderAndWallets();
  };

  const switchToHardhat = async () => {
    dispatch(setNetworkByName(NetworkName.Hardhat));
    await retryLoadProviderAndWallets();
  };

  const showErrorDetails = () => {
    setErrorDetailsOpen(true);
  };
  const hideErrorDetails = () => {
    setErrorDetailsOpen(false);
  };

  const retryLoadProviderAndWallets = async () => {
    setError(undefined);
    await loadNetworkAndWallets(network.current);
  };

  return (<>
    <div className="overlay-container">
      <div className={styles.textWrapper}>
        {isDefined(error) && (
          <>
            <Text className={styles.errorText}>{error.message}</Text>
            <TextButton text="Show more" action={showErrorDetails} />
            <div className={styles.retryButtonContainer}>
              <Button
                startIcon={IconType.Retry}
                children="Retry"
                onClick={retryLoadProviderAndWallets}
                buttonClassName={styles.button}
              />
              {hasWallets && (
                <Button
                  startIcon={IconType.Wallet}
                  children="View Wallets"
                  onClick={() => setShowRecoveryMode(true)}
                  buttonClassName={styles.button}
                />
              )}
              {network.current.name !== defaultNetworkName && (
                <Button
                  startIcon={IconType.Swap}
                  children={`Switch to ${defaultNetwork.shortPublicName}`}
                  onClick={switchToDefaultNetwork}
                  buttonClassName={styles.button}
                />
              )}
              {networkStoredSettings &&
                (!networkStoredSettings.useDefaultRailwayRPCsAsBackup ||
                  networkStoredSettings.rpcCustomURLs.length) && (
                  <Button
                    startIcon={IconType.Refresh}
                    children={`Reset to default RPCs`}
                    onClick={useDefaultRailwayRPCs}
                    buttonClassName={styles.button}
                  />
                )}
              {ReactConfig.IS_DEV &&
                network.current.name !== NetworkName.Hardhat && (
                  <Button
                    startIcon={IconType.Swap}
                    children={`[Dev] Switch to Hardhat`}
                    onClick={switchToHardhat}
                    buttonClassName={styles.button}
                  />
                )}
              {ReactConfig.IS_DEV && (
                <Button
                  startIcon={IconType.Trash}
                  children="[Dev] Delete all wallets"
                  onClick={deleteWallets_DevOnly}
                  buttonClassName={styles.button}
                />
              )}
            </div>
          </>
        )}
        {!isDefined(error) && (
          <>
            <Text className={styles.loadingText}>
              Loading Railway wallets, connecting to networks and scanning
              transactions...
            </Text>
            <div className={styles.progressBarContainer}>
              <ProgressBar progress={progress} />
            </div>
          </>
        )}
      </div>
    </div>
    {showRecoveryMode && (
      <>
        {}
        <RecoveryWalletsModal
          onClose={() => {
            setShowRecoveryMode(false);
          }}
        />
      </>
    )}
    {errorDetailsOpen && isDefined(error) && (
      <ErrorDetailsModal error={error} onDismiss={hideErrorDetails} />
    )}
  </>);
};
