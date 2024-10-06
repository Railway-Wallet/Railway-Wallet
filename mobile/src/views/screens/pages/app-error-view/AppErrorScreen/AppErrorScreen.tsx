import { isDefined } from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Linking,
  Platform,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import VersionNumber from "react-native-version-number";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { SwirlBackground } from "@components/images/SwirlBackground/SwirlBackground";
import { RecoveryType } from "@models/RecoveryType";
import {
  AppStatus,
  getSupportedNetworks,
  ImageSwirl,
  useAppDispatch,
  useReduxSelector,
  WalletStorageService,
} from "@react-shared";
import { ErrorDetailsModal } from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { getPlatformDevice } from "@services/util/platform-os-service";
import { Constants } from "@utils/constants";
import { imageHeightFromDesiredWidth } from "@utils/image-utils";
import { styles } from "./styles";

type AppErrorScreenProps = {
  error?: Error;
  retry: () => void;
  setRecoveryMode: (recoveryType: RecoveryType) => void;
  appStatus: AppStatus;
};

export const AppErrorScreen: React.FC<AppErrorScreenProps> = ({
  error,
  retry,
  setRecoveryMode,
  appStatus,
}) => {
  const { remoteConfig } = useReduxSelector("remoteConfig");
  const dispatch = useAppDispatch();
  const [hasWallets, setHasWallets] = useState<boolean>(false);
  const [hasNetworks, setHasNetworks] = useState<boolean>(false);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);

  const device = getPlatformDevice(Platform.OS);
  const currentConfig = remoteConfig.current;
  const { appVersion } = VersionNumber;

  useEffect(() => {
    const checkWallets = async () => {
      const walletStorageService = new WalletStorageService(dispatch);
      const storedWallets = await walletStorageService.fetchStoredWallets();
      if (storedWallets.length > 0) {
        setHasWallets(true);
      }
    };

    const checkNetworks = () => {
      const networksExist = getSupportedNetworks().length > 0;
      setHasNetworks(networksExist && isDefined(currentConfig));
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkWallets();
    checkNetworks();
  }, [dispatch, currentConfig]);

  StatusBar.setBarStyle("light-content");

  const windowWidth = Dimensions.get("window").width;
  const swirlWidth = windowWidth * 0.8;
  const swirlHeight = imageHeightFromDesiredWidth(ImageSwirl(), swirlWidth);

  const handleGoToStore = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Linking.openURL(
      Platform.OS === "android"
        ? Constants.RAILWAY_PLAY_STORE
        : Constants.RAILWAY_APP_STORE
    );
  };

  const showErrorDetails = () => {
    setErrorDetailsOpen(true);
  };
  const hideErrorDetails = () => {
    setErrorDetailsOpen(false);
  };

  return (
    <>
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
                {error.message}{" "}
                <Text style={styles.errorShowMore} onPress={showErrorDetails}>
                  (show more)
                </Text>
              </Text>
              <View style={styles.buttonContainer}>
                {appStatus === AppStatus.VersionOutdated && (
                  <ButtonWithTextAndIcon
                    icon="link"
                    title={
                      Platform.OS === "android"
                        ? "Open Google Play Store"
                        : "Open App Store"
                    }
                    onPress={handleGoToStore}
                  />
                )}
                {appStatus === AppStatus.Maintenance && (
                  <ButtonWithTextAndIcon
                    icon="refresh"
                    title="Reload"
                    onPress={retry}
                  />
                )}
                {(appStatus === AppStatus.Recovery ||
                  appStatus === AppStatus.Error) && (
                  <ButtonWithTextAndIcon
                    icon="refresh"
                    title="Retry"
                    onPress={retry}
                  />
                )}
              </View>
              {hasWallets && (
                <View style={styles.buttonContainer}>
                  <ButtonWithTextAndIcon
                    icon="wallet-outline"
                    title="View Wallets"
                    onPress={() => setRecoveryMode(RecoveryType.Wallets)}
                  />
                </View>
              )}
              {hasNetworks && (
                <View style={styles.buttonContainer}>
                  <ButtonWithTextAndIcon
                    icon="cog-outline"
                    title="View Networks"
                    onPress={() => setRecoveryMode(RecoveryType.Networks)}
                  />
                </View>
              )}
            </>
          )}
          {!isDefined(error) && (
            <Text style={styles.loadingText}>Launching Railway app...</Text>
          )}
        </View>
        {isDefined(error) && (
          <Text style={styles.footerText}>
            Railway {device}, Version {appVersion}
          </Text>
        )}
        {isDefined(error) && (
          <ErrorDetailsModal
            show={errorDetailsOpen}
            error={error}
            onDismiss={hideErrorDetails}
          />
        )}
      </SafeAreaView>
    </>
  );
};
