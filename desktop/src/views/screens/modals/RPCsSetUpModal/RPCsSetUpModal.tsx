import {
  FallbackProviderJsonConfig,
  isDefined,
  Network,
  ProviderJson,
} from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { SelectableListItem } from '@components/SelectableListItem/SelectableListItem';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  logDev,
  logDevError,
  NetworkStoredSettingsService,
  ProviderLoader,
  ProviderNodeType,
  ProviderService,
  SettingsForNetwork,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  useReduxSelector,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { IconType, renderIcon } from '@services/util/icon-service';
import { Button } from '@views/components/Button/Button';
import { AddCustomRPCModal } from '../settings/AddCustomRPCModal/AddCustomRPCModal';
import styles from '../settings/SettingsWalletInfoModal/SettingsWalletInfoModal.module.scss';

type Props = {
  selectedNetwork: Network;
  onClose: () => void;
};

export const RPCsSetUpModal = ({ onClose, selectedNetwork }: Props) => {
  const { remoteConfig } = useReduxSelector('remoteConfig');

  const dispatch = useAppDispatch();

  const [networkStoredSettings, setNetworkStoredSettings] =
    useState<Optional<SettingsForNetwork>>();

  const [showAddCustomRPCModal, setShowAddCustomRPCModal] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  useEffect(() => {
    const updateNetwork = async () => {
      const storedSettings =
        await NetworkStoredSettingsService.getSettingsForNetwork(
          selectedNetwork.name,
        );
      setNetworkStoredSettings(storedSettings);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateNetwork();
  }, [selectedNetwork]);

  const updateSettings = async (updatedSettings: SettingsForNetwork) => {
    await NetworkStoredSettingsService.storeSettingsForNetwork(
      selectedNetwork.name,
      updatedSettings,
    );
    setNetworkStoredSettings(updatedSettings);
  };

  const setUseDefaultRailwayRPCsAsBackup = async (
    useDefaultRailwayRPCsAsBackup: boolean,
  ) => {
    if (!networkStoredSettings) {
      logDev('No networkStoredSettings');
      return;
    }
    const settings: SettingsForNetwork = {
      ...networkStoredSettings,
      useDefaultRailwayRPCsAsBackup,
    };
    await updateSettings(settings);
    await reloadProviders();
  };

  const addRPCCustomURL = async (rpcCustomURL: string) => {
    if (!networkStoredSettings) {
      logDev('No networkStoredSettings');
      return;
    }
    if (networkStoredSettings.rpcCustomURLs.includes(rpcCustomURL)) {
      logDev('Duplicate');
      return;
    }
    const settings: SettingsForNetwork = {
      ...networkStoredSettings,
      rpcCustomURLs: [...networkStoredSettings.rpcCustomURLs, rpcCustomURL],
    };
    await updateSettings(settings);
    await reloadProviders();
  };

  const promptRemoveRPCCustomURL = (url: string) => {
    setAlert({
      title: 'Remove custom RPC?',
      message: `URL: ${url}.`,
      onClose: () => setAlert(undefined),
      onSubmit: async () => {
        setAlert(undefined);
        await removeRPCCustomURL(url);
      },
      submitTitle: 'Remove',
    });
  };

  const removeRPCCustomURL = async (url: string) => {
    if (!networkStoredSettings) {
      logDev('No networkStoredSettings');
      return;
    }
    const settings: SettingsForNetwork = {
      ...networkStoredSettings,
      rpcCustomURLs: networkStoredSettings.rpcCustomURLs.filter(
        rpcCustomURL => rpcCustomURL !== url,
      ),
    };
    await updateSettings(settings);
    await reloadProviders();
  };

  const reloadProviders = async () => {
    try {
      dispatch(
        showImmediateToast({
          message: `Reloading RPC providers...`,
          type: ToastType.Info,
        }),
      );
      await ProviderLoader.unloadEngineProvider(selectedNetwork.name);
      await ProviderService.destroy(selectedNetwork.name);

      await ProviderService.loadFrontendProviderForNetwork(
        selectedNetwork.name,
        ProviderNodeType.FullNode,
      );
      await ProviderLoader.loadEngineProvider(selectedNetwork.name, dispatch);

      dispatch(
        showImmediateToast({
          message: `RPC Providers loaded successfully`,
          type: ToastType.Info,
        }),
      );
    } catch (cause) {
      const error = new Error('Failed re-connecting to network', { cause });
      logDevError(error);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const defaultRPCConfigMap = remoteConfig.current?.networkProvidersConfig;
  const defaultRPCConfigs: FallbackProviderJsonConfig[] = defaultRPCConfigMap
    ? Object.values(defaultRPCConfigMap)
    : [];
  const defaultRPCProvidersForChain: ProviderJson[] =
    defaultRPCConfigs.find(
      config => config.chainId === selectedNetwork.chain.id,
    )?.providers ?? [];

  const hasNoCustomProviders =
    (networkStoredSettings?.rpcCustomURLs.length ?? 0) === 0;

  return (
    <>
      <GenericModal
        onClose={() => onClose()}
        title={`${selectedNetwork.publicName} RPC Providers`}
        showClose={false}
        shouldCloseOnOverlayClick={false}
      >
        <Text className={styles.sectionHeader}>
          Select the RPCs you would like to use for this network. These can be
          changed in Settings {'>'} Network & RPCs.
        </Text>

        <Text className={styles.sectionHeader}>Default RPC Providers:</Text>
        <div className={styles.itemCard}>
          {defaultRPCProvidersForChain.map((provider, index) => {
            return (
              <Text key={index} className={styles.label}>
                {provider.provider.includes('railwayapi')
                  ? 'Alchemy Proxy'
                  : provider.provider}
              </Text>
            );
          })}
        </div>
        {networkStoredSettings &&
          !!networkStoredSettings?.rpcCustomURLs.length && (
            <div className={styles.itemContainerUpperSpacing}>
              <SelectableListItem
                title="Status"
                rightText={
                  networkStoredSettings.useDefaultRailwayRPCsAsBackup
                    ? 'Enabled'
                    : 'Disabled'
                }
                rightSubtext={
                  networkStoredSettings.useDefaultRailwayRPCsAsBackup
                    ? 'Using default RPCs as backups'
                    : 'Only connecting to custom RPCs'
                }
                onTap={() =>
                  setUseDefaultRailwayRPCsAsBackup(
                    !networkStoredSettings.useDefaultRailwayRPCsAsBackup,
                  )
                }
                hideRightIcon={true}
              />
            </div>
          )}

        <Text className={styles.sectionHeader}>Custom RPC Providers:</Text>
        <div className={cn(styles.itemCard)}>
          {hasNoCustomProviders && (
            <Text className={styles.label}>No custom RPCs added.</Text>
          )}
          {networkStoredSettings?.rpcCustomURLs.map((rpcCustomURL, index) => (
            <TextButton
              key={index}
              text={rpcCustomURL}
              textClassName={styles.label}
              action={() => promptRemoveRPCCustomURL(rpcCustomURL)}
            />
          ))}
        </div>
        <div
          className={cn(
            styles.itemCard,
            styles.itemContainerUpperSpacing,
            styles.clickable,
          )}
          onClick={() => setShowAddCustomRPCModal(true)}
        >
          <div className={styles.phraseHeader}>
            {hasNoCustomProviders ? (
              <Text>Set custom provider</Text>
            ) : (
              <Text>Add custom provider</Text>
            )}

            {renderIcon(IconType.PlusCircle, 20)}
          </div>
        </div>
        <Button buttonClassName={styles.submitButton} onClick={onClose}>
          Continue with {hasNoCustomProviders ? 'default' : 'custom'} providers
        </Button>
      </GenericModal>
      {showAddCustomRPCModal && isDefined(selectedNetwork) && (
        <>
          <AddCustomRPCModal
            network={selectedNetwork}
            onClose={async (customRPCURL?: string) => {
              setShowAddCustomRPCModal(false);
              if (isDefined(customRPCURL)) {
                await addRPCCustomURL(customRPCURL);
              }
            }}
          />
        </>
      )}
      {alert && <GenericAlert {...alert} />}
      {errorModal && <ErrorDetailsModal {...errorModal} />}
    </>
  );
};
