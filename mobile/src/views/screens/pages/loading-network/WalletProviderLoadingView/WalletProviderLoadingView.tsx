import {
  isDefined,
  Network,
  NETWORK_CONFIG,
  NetworkName,
} from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Dimensions, StatusBar, Text, View } from "react-native";
import { Bar as ProgressBar } from "react-native-progress";
import { SafeAreaView } from "react-native-safe-area-context";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { SwirlBackground } from "@components/images/SwirlBackground/SwirlBackground";
import { RootStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  delay,
  getWalletTransactionHistory,
  ImageSwirl,
  logDevError,
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
  SharedConstants,
  StorageService,
  store,
  styleguide,
  useAppDispatch,
  useReduxSelector,
  WalletService,
  WalletStorageService,
  WalletTokenService,
} from "@react-shared";
import { WalletSecureServiceReactNative } from "@services/wallet/wallet-secure-service-react-native";
import { Constants } from "@utils/constants";
import { imageHeightFromDesiredWidth } from "@utils/image-utils";
import { ErrorDetailsModal } from "@views/screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<RootStackParamList, "WalletProviderLoading">;
};

const CHECK_PROVIDER_LOADED_DELAY = 400;
const CHECK_ARTIFACTS_PROGRESS_DELAY = 1000;

const PROGRESS_START = 5;
const PROGRESS_PROVIDER_LOADED = 20;
const PROGRESS_ARTIFACTS_LOADED = 80;
const PROGRESS_WALLETS_LOADED = 95;
const PROGRESS_END = 100;

const SWELL_FACTOR = 0.15;

export const WalletProviderLoadingView: React.FC<Props> = ({ navigation }) => {
  const { network } = useReduxSelector("network");
  StatusBar.setBarStyle("light-content");
  const dispatch = useAppDispatch();

  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<string>("Loading...");
  const [error, setError] = useState<Optional<Error>>();

  const [hasWallets, setHasWallets] = useState<boolean>(false);
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);
  const [networkStoredSettings, setNetworkStoredSettings] =
    useState<Optional<SettingsForNetwork>>();

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

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

  const useDefaultRailwayRPCs = async () => {
    if (!networkStoredSettings) {
      return;
    }
    const updatedSettings: SettingsForNetwork =
      NetworkStoredSettingsService.defaultSettingsForNetwork();
    await NetworkStoredSettingsService.storeSettingsForNetwork(
      network.current.name,
      updatedSettings
    );
    await ProviderService.loadFrontendProviderForNetwork(
      network.current.name,
      ProviderNodeType.FullNode
    );
    setNetworkStoredSettings(updatedSettings);
    await retryLoadProviderAndWallets();
  };

  const updateProgress = (amount: number) => {
    setProgress(amount / 100);
  };

  const swellProgressTowards = (target: number) => {
    setProgress((current) => current + (target / 100 - current) * SWELL_FACTOR);
  };

  const waitForProviderToLoad = async (): Promise<boolean> => {
    if (ProviderLoader.firstProviderLoaded) {
      return true;
    } else if (isDefined(ProviderLoader.firstProviderLoadError)) {
      return false;
    }
    await delay(CHECK_PROVIDER_LOADED_DELAY);
    swellProgressTowards(PROGRESS_PROVIDER_LOADED);
    return waitForProviderToLoad();
  };

  const reloadProvider = async (loadNetwork: Network) => {
    const feesSerialized = await ProviderLoader.loadEngineProvider(
      loadNetwork.name,
      dispatch
    );
    const networkService = new NetworkService(dispatch);
    await networkService.selectNetwork(loadNetwork.name, feesSerialized);
  };

  const loadNetworkAndWallets = async (loadNetwork: Network) => {
    updateProgress(PROGRESS_START);

    setProgressStatus("Connecting to networks...");
    const loaded = await waitForProviderToLoad();
    if (!loaded) {
      setError(
        new Error(
          `Error connecting to ${network.current.shortPublicName} network.`,
          { cause: ProviderLoader.firstProviderLoadError }
        )
      );
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      reloadProvider(network.current);
      return;
    }
    updateProgress(PROGRESS_PROVIDER_LOADED);

    setProgressStatus("Downloading prover artifacts...");
    while (store.getState().artifactsProgress.progress < 1) {
      await delay(CHECK_ARTIFACTS_PROGRESS_DELAY);
      updateProgress(
        store.getState().artifactsProgress.progress *
          (PROGRESS_ARTIFACTS_LOADED - PROGRESS_PROVIDER_LOADED) +
          PROGRESS_PROVIDER_LOADED
      );
    }
    updateProgress(PROGRESS_ARTIFACTS_LOADED);

    try {
      setProgressStatus("Loading Railway wallets...");

      const walletService = new WalletService(
        dispatch,
        new WalletSecureServiceReactNative()
      );

      const hasWallets = await walletService.loadWalletsFromStorage(
        network.current,
        (walletLoadProgress: number) => {
          updateProgress(
            (walletLoadProgress *
              (PROGRESS_WALLETS_LOADED - PROGRESS_ARTIFACTS_LOADED)) /
              100 +
              PROGRESS_ARTIFACTS_LOADED
          );
        }
      );
      updateProgress(PROGRESS_WALLETS_LOADED);

      if (hasWallets) {
        const walletTokenService = new WalletTokenService(dispatch);
        await walletTokenService.addTokensForWalletsIfNeeded(loadNetwork.name);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        RailgunTransactionHistorySync.resyncAllTransactionsIfNecessary(
          dispatch,
          network.current,
          getWalletTransactionHistory,
          refreshRailgunBalances,
          Constants.REFRESH_TX_HISTORY_EVERY_LOAD_IN_DEV
        );
      }

      updateProgress(PROGRESS_END);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      navigateNextScreen();
    } catch (cause) {
      const error = new Error("Could not load Railway wallet.", { cause });
      logDevError(error);
      setError(error);
    }
  };

  const deleteWallets_DevOnly = async () => {
    if (!ReactConfig.IS_DEV) {
      return;
    }
    const walletService = new WalletService(
      dispatch,
      new WalletSecureServiceReactNative()
    );
    await walletService.clearAllWallets();
  };

  const defaultNetworkName = NetworkService.getDefaultNetworkName();
  const defaultNetwork = NETWORK_CONFIG[defaultNetworkName];

  const navigateNextScreen = async () => {
    const hasSeenOnboarding = await StorageService.getItem(
      SharedConstants.HAS_SEEN_APP_INTRO
    );
    const shouldShowOnboarding = !isDefined(hasSeenOnboarding);

    navigation.reset({
      index: 0,
      routes: [{ name: shouldShowOnboarding ? "OnboardingScreen" : "Tabs" }],
    });
  };

  const switchToDefaultNetwork = async () => {
    dispatch(setNetworkByName(defaultNetworkName));
    await retryLoadProviderAndWallets();
  };

  const switchToHardhat = async () => {
    dispatch(setNetworkByName(NetworkName.Hardhat));
    await retryLoadProviderAndWallets();
  };

  const retryLoadProviderAndWallets = async () => {
    setError(undefined);
    await loadNetworkAndWallets(network.current);
  };

  const viewRecoveryModeWallets = () => {
    navigation.navigate("RecoveryWallets", {});
  };

  const windowWidth = Dimensions.get("window").width;
  const swirlWidth = windowWidth * 0.8;
  const swirlHeight = imageHeightFromDesiredWidth(ImageSwirl(), swirlWidth);

  return (
    <SafeAreaView style={styles.container} edges={["right", "top", "left"]}>
      <SwirlBackground
        style={{
          ...styles.swirlBackground,
          width: swirlWidth,
          height: swirlHeight,
        }}
      />

      <View style={styles.textWrapper}>
        {isDefined(error) && (
          <>
            <Text style={styles.errorText}>
              {error.message}
              {"\n"}
              <Text
                style={styles.errorShowMore}
                onPress={openErrorDetailsModal}
              >
                (show more)
              </Text>
            </Text>
            <View style={styles.retryContainer}>
              <ButtonWithTextAndIcon
                icon="refresh"
                title="Retry"
                onPress={retryLoadProviderAndWallets}
              />
            </View>
            {hasWallets && (
              <View style={styles.retryContainer}>
                <ButtonWithTextAndIcon
                  icon="wallet-outline"
                  title="View Wallets"
                  onPress={viewRecoveryModeWallets}
                />
              </View>
            )}
            {network.current.name !== defaultNetworkName && (
              <View style={styles.retryContainer}>
                <ButtonWithTextAndIcon
                  icon="swap-vertical"
                  title={`Switch to ${defaultNetwork.shortPublicName}`}
                  onPress={switchToDefaultNetwork}
                />
              </View>
            )}
            {networkStoredSettings &&
              (!networkStoredSettings.useDefaultRailwayRPCsAsBackup ||
                networkStoredSettings.rpcCustomURLs.length) && (
                <View style={styles.retryContainer}>
                  <ButtonWithTextAndIcon
                    icon="refresh"
                    title={`Reset to default RPCs`}
                    onPress={useDefaultRailwayRPCs}
                  />
                </View>
              )}
            {ReactConfig.IS_DEV &&
              network.current.name !== NetworkName.Hardhat && (
                <View style={styles.retryContainer}>
                  <ButtonWithTextAndIcon
                    icon="swap-vertical"
                    title={`[Dev] Switch to Hardhat`}
                    onPress={switchToHardhat}
                  />
                </View>
              )}
            {ReactConfig.IS_DEV && (
              <View style={styles.retryContainer}>
                <ButtonWithTextAndIcon
                  icon="trash-can-outline"
                  title="[Dev] Delete all wallets"
                  onPress={deleteWallets_DevOnly}
                />
              </View>
            )}
          </>
        )}
        {!isDefined(error) && (
          <>
            <Text style={styles.loadingText}>{progressStatus}</Text>
            <Text style={styles.disclaimerText}>
              {"This process might take some time."}
            </Text>
            <View style={styles.progressBarWrapper}>
              <ProgressBar
                progress={progress}
                color={styleguide.colors.txGreen()}
                borderColor={styleguide.colors.white}
                style={styles.progressBar}
              />
            </View>
          </>
        )}
      </View>
      {isDefined(error) && (
        <ErrorDetailsModal
          error={error}
          show={showErrorDetailsModal}
          onDismiss={dismissErrorDetailsModal}
        />
      )}
    </SafeAreaView>
  );
};
