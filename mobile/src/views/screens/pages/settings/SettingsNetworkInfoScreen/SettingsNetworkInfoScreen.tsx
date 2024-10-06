import {
  FallbackProviderJsonConfig,
  isDefined,
  ProviderJson,
} from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { SettingsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  logDev,
  logDevError,
  NetworkStoredSettingsService,
  ProviderLoader,
  ProviderNodeType,
  ProviderService,
  SettingsForNetwork,
  showImmediateToast,
  styleguide,
  ToastType,
  useAppDispatch,
  useReduxSelector,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { SettingsListHeader } from "@screens/tabs/SettingsScreen/SettingsListHeader/SettingsListHeader";
import { SettingsListItem } from "@screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

type Props = {
  navigation: NavigationProp<SettingsStackParamList, "SettingsNetworkInfo">;
  route: RouteProp<
    { params: SettingsStackParamList["SettingsNetworkInfo"] },
    "params"
  >;
};

export const SettingsNetworkInfoScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { network, newRpcUrl } = route.params;

  const { remoteConfig } = useReduxSelector("remoteConfig");
  const dispatch = useAppDispatch();

  const [networkStoredSettings, setNetworkStoredSettings] =
    useState<Optional<SettingsForNetwork>>();
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);

  useEffect(() => {
    const updateNetwork = async () => {
      const storedSettings =
        await NetworkStoredSettingsService.getSettingsForNetwork(network.name);
      setNetworkStoredSettings(storedSettings);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateNetwork();
  }, [network.name]);

  useEffect(() => {
    if (isDefined(newRpcUrl)) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      addRPCCustomURL(newRpcUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRpcUrl]);

  const addRPCCustomURL = async (rpcCustomURL: string) => {
    if (!networkStoredSettings) {
      logDev("No networkStoredSettings");
      return;
    }
    if (networkStoredSettings.rpcCustomURLs.includes(rpcCustomURL)) {
      logDev("Duplicate");
      return;
    }
    const settings: SettingsForNetwork = {
      ...networkStoredSettings,
      rpcCustomURLs: [...networkStoredSettings.rpcCustomURLs, rpcCustomURL],
    };
    await updateSettings(settings);
    await reloadProviders();
  };

  const updateSettings = async (updatedSettings: SettingsForNetwork) => {
    await NetworkStoredSettingsService.storeSettingsForNetwork(
      network.name,
      updatedSettings
    );
    setNetworkStoredSettings(updatedSettings);
  };

  const reloadProviders = async () => {
    try {
      dispatch(
        showImmediateToast({
          message: `Reloading RPC providers...`,
          type: ToastType.Info,
        })
      );

      await ProviderService.loadFrontendProviderForNetwork(
        network.name,
        ProviderNodeType.FullNode
      );
      await ProviderLoader.loadEngineProvider(network.name, dispatch);

      dispatch(
        showImmediateToast({
          message: `RPC Providers loaded successfully`,
          type: ToastType.Info,
        })
      );
    } catch (cause) {
      const error = new Error("Error re-connecting to network", { cause });
      logDevError(error);
      setErrorModal({
        show: true,
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const onAddRpc = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    navigation.navigate("SettingsAddRPC", { network });
  };

  const promptRemoveRPCCustomURL = (url: string) => {
    triggerHaptic(HapticSurface.NavigationButton);
    Alert.alert("Remove custom RPC?", `URL: ${url}.`, [
      {
        text: "Remove",
        onPress: () => removeRPCCustomURL(url),
        style: "destructive",
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const setUseDefaultRailwayRPCsAsBackup = async (
    useDefaultRailwayRPCsAsBackup: boolean
  ) => {
    if (!networkStoredSettings) {
      logDev("No networkStoredSettings");
      return;
    }
    const settings: SettingsForNetwork = {
      ...networkStoredSettings,
      useDefaultRailwayRPCsAsBackup,
    };
    await updateSettings(settings);
    await reloadProviders();
  };

  const removeRPCCustomURL = async (url: string) => {
    if (!networkStoredSettings) {
      logDev("No networkStoredSettings");
      return;
    }
    const settings: SettingsForNetwork = {
      ...networkStoredSettings,
      rpcCustomURLs: networkStoredSettings.rpcCustomURLs.filter(
        (rpcCustomURL) => rpcCustomURL !== url
      ),
    };
    await updateSettings(settings);
    await reloadProviders();
  };

  const defaultRPCConfigMap = remoteConfig.current?.networkProvidersConfig;
  const defaultRPCConfigs: FallbackProviderJsonConfig[] = defaultRPCConfigMap
    ? Object.values(defaultRPCConfigMap)
    : [];
  const defaultRPCProvidersForChain: ProviderJson[] =
    defaultRPCConfigs.find((config) => config.chainId === network.chain.id)
      ?.providers ?? [];

  const hasCustomRPCs = (networkStoredSettings?.rpcCustomURLs ?? []).length > 0;

  const defaultRPCsRightView = () => (
    <View style={styles.listRightView}>
      <Text style={styles.listRightViewText}>
        {networkStoredSettings?.useDefaultRailwayRPCsAsBackup ?? false
          ? "Enabled"
          : "Disabled"}
      </Text>
      <Text style={styles.listRightViewSubtext}>
        {networkStoredSettings?.useDefaultRailwayRPCsAsBackup ?? false
          ? "Using default RPCs as backups"
          : "Only connecting to custom RPCs"}
      </Text>
    </View>
  );

  return (
    <>
      <AppHeader
        title={network.publicName}
        backgroundColor={styleguide.colors.headerBackground}
        headerLeft={<HeaderBackButton label="Networks" />}
        isModal={false}
      />
      <View style={styles.wrapper}>
        <ScrollView>
          {/* eslint-disable-next-line react-native/no-inline-styles */}
          <View style={[styles.itemRow, { marginTop: 16 }]}>
            <SettingsListHeader title="Details" />
            <View style={styles.items}>
              <SettingsListItem
                title="Chain ID"
                description={`${network.chain.id}`}
              />
            </View>
            <View style={styles.items}>
              <SettingsListItem
                title="Reload providers"
                icon="refresh"
                onTap={reloadProviders}
              />
            </View>
          </View>
          <View style={styles.itemRow}>
            <SettingsListHeader title="Default RPC Providers" />
            <View style={styles.items}>
              {defaultRPCProvidersForChain.map((provider, index) => (
                <SettingsListItem
                  key={index}
                  centerStyle={styles.listItemCenter}
                  titleStyle={styles.listItemTitle}
                  title={
                    provider.provider.includes("railwayapi")
                      ? "Alchemy Proxy"
                      : provider.provider
                  }
                />
              ))}
            </View>
          </View>
          <View style={styles.itemRow}>
            <SettingsListHeader title="Custom RPC Providers" />
            <View
              style={[
                styles.items,
                hasCustomRPCs ? styles.extraItemsTopPadding : {},
              ]}
            >
              {!hasCustomRPCs && (
                <Text style={styles.placeholderText}>
                  No custom RPCs added.
                </Text>
              )}
              {networkStoredSettings?.rpcCustomURLs.map(
                (rpcCustomURL, index) => (
                  <SettingsListItem
                    key={index}
                    title={rpcCustomURL}
                    centerStyle={styles.listItemCenter}
                    titleStyle={styles.listItemTitle}
                    icon="minus-circle"
                    onTap={() => promptRemoveRPCCustomURL(rpcCustomURL)}
                  />
                )
              )}
            </View>
            <View style={styles.items}>
              <SettingsListItem
                title="Set custom provider"
                icon="plus"
                onTap={onAddRpc}
              />
            </View>
          </View>
          {networkStoredSettings && hasCustomRPCs && (
            // eslint-disable-next-line react-native/no-inline-styles
            <View style={[styles.itemRow, { marginBottom: 20 }]}>
              <View style={styles.items}>
                <SettingsListItem
                  title="Default RPCs"
                  rightView={defaultRPCsRightView}
                  onTap={() =>
                    setUseDefaultRailwayRPCsAsBackup(
                      !networkStoredSettings.useDefaultRailwayRPCsAsBackup
                    )
                  }
                />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </>
  );
};
