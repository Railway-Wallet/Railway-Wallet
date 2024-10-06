import {
  FallbackProviderJsonConfig,
  isDefined,
  Network,
  ProviderJson,
} from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
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
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { WideButtonTextOnly } from "@views/components/buttons/WideButtonTextOnly/WideButtonTextOnly";
import { AppHeader } from "@views/components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@views/components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { SettingsListHeader } from "@views/screens/tabs/SettingsScreen/SettingsListHeader/SettingsListHeader";
import { SettingsListItem } from "@views/screens/tabs/SettingsScreen/SettingsListItem/SettingsListItem";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "../ErrorDetailsModal/ErrorDetailsModal";
import { styles } from "./styles";

type Props = {
  selectedNetwork: Network;
  onClose: () => void;
};

export const RPCsSetUpModal = ({ onClose, selectedNetwork }: Props) => {
  const { remoteConfig } = useReduxSelector("remoteConfig");
  const navigation = useNavigation();

  const dispatch = useAppDispatch();

  const [networkStoredSettings, setNetworkStoredSettings] =
    useState<Optional<SettingsForNetwork>>();

  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  useEffect(() => {
    const updateNetwork = async () => {
      const storedSettings =
        await NetworkStoredSettingsService.getSettingsForNetwork(
          selectedNetwork.name
        );
      setNetworkStoredSettings(storedSettings);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateNetwork();
  }, [selectedNetwork]);

  const updateSettings = async (updatedSettings: SettingsForNetwork) => {
    await NetworkStoredSettingsService.storeSettingsForNetwork(
      selectedNetwork.name,
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
        selectedNetwork.name,
        ProviderNodeType.FullNode
      );
      await ProviderLoader.loadEngineProvider(selectedNetwork.name, dispatch);

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
    onClose();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
    (navigation as any).navigate("SettingsAddRPC", {
      network: selectedNetwork,
    });
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

  const defaultRPCConfigMap = remoteConfig.current?.networkProvidersConfig;
  const defaultRPCConfigs: FallbackProviderJsonConfig[] = defaultRPCConfigMap
    ? Object.values(defaultRPCConfigMap)
    : [];
  const defaultRPCProvidersForChain: ProviderJson[] =
    defaultRPCConfigs.find(
      (config) => config.chainId === selectedNetwork.chain.id
    )?.providers ?? [];

  const hasCustomRPCs = (networkStoredSettings?.rpcCustomURLs ?? []).length > 0;

  return (
    <Modal animationType="slide" presentationStyle="formSheet" visible>
      <AppHeader
        title={`${selectedNetwork.publicName} RPC Providers`}
        headerStatusBarHeight={16}
        backgroundColor={styleguide.colors.gray5()}
        isModal
        headerRight={<HeaderTextButton text={"Close"} onPress={onClose} />}
      />
      <View style={styles.wrapper}>
        <ScrollView>
          <Text style={styles.sectionHeader}>
            Select the RPCs you would like to use for this network. These can be
            changed in Settings {">"} Network & RPCs.
          </Text>
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
          <WideButtonTextOnly
            onPress={onClose}
            title={`Continue with ${
              hasCustomRPCs ? "custom" : "default"
            } providers`}
            additionalStyles={styles.continueButton}
          />
        </ScrollView>
      </View>
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </Modal>
  );
};
