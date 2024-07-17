import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  AlertButtonPosition,
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { ListItem } from '@components/ListItem/ListItem';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { Text } from '@components/Text/Text';
import {
  generateAllPOIsForWallet,
  getWalletTransactionHistory,
  logDevError,
  networkForName,
  NonceStorageService,
  RailgunTransactionHistorySync,
  ReactConfig,
  refreshRailgunBalances,
  rescanFullUTXOMerkletreesAndWallets,
  resetFullTXIDMerkletreesV2,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { PendingBalancesModal } from '@screens/modals/POI/PendingBalancesModal/PendingBalancesModal';
import { POIListsModal } from '@screens/modals/settings/POIListsModal/POIListsModal';
import { SettingsBroadcastersModal } from '@screens/modals/settings/SettingsBroadcastersModal/SettingsBroadcastersModal';
import { SettingsDefaultsModal } from '@screens/modals/settings/SettingsDefaultsModal/SettingsDefaultsModal';
import { SettingsNetworksModal } from '@screens/modals/settings/SettingsNetworksModal/SettingsNetworksModal';
import { SettingsSavedAddressesModal } from '@screens/modals/settings/SettingsSavedAddressesModal/SettingsSavedAddressesModal';
import { SettingsWalletsModal } from '@screens/modals/settings/SettingsWalletsModal/SettingsWalletsModal';
import { wipeDevice_DESTRUCTIVE } from '@services/security/wipe-device-service';
import { IconType, renderIcon } from '@services/util/icon-service';
import { Constants } from '@utils/constants';
import { ChangePasswordModal } from '@views/screens/modals/ChangePasswordModal/ChangePasswordModal';
import { WipeDeviceDataModal } from '@views/screens/modals/settings/WipeDeviceDataModal/WipeDeviceDataModal';
import styles from './Settings.module.scss';

type Props = {
  onClose?: () => void;
};

export const SettingsScreen: React.FC<Props> = ({ onClose }) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const { poiRequired } = usePOIRequiredForCurrentNetwork();
  const [defaultsModalOpen, setDefaultsModalOpen] = useState(false);
  const [walletSettingsOpen, setWalletSettingsOpen] = useState(false);
  const [pendingBalancesOpen, setPendingBalancesOpen] = useState(false);
  const [networkSettingsOpen, setNetworkSettingsOpen] = useState(false);
  const [savedAddressesOpen, setSavedAddressesOpen] = useState(false);
  const [broadcastersSettingsOpen, setBroadcastersSettingsOpen] =
    useState(false);
  const [poiListSettingsOpen, setPoiListSettingsOpen] = useState(false);
  const [wipeDeviceDataOpen, setWipeDeviceDataOpen] = useState(false);
  const [changePasswordSettingsOpen, setChangePasswordSettingsOpen] =
    useState(false);

  const [alert, setAlert] = useState<Optional<AlertProps>>();
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const [settingsAlert, setSettingsAlert] = useState<AlertProps | undefined>(
    undefined,
  );
  const [loadingText, setLoadingText] = useState<Optional<string>>(undefined);

  const dispatch = useAppDispatch();

  const promptRescanPrivateBalances = () => {
    setAlert({
      title: 'Re-scan balances',
      message:
        'We suggest this action to sync your private balances, in case of error. This action can take a few minutes.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Scan',
      onSubmit: async () => {
        setAlert(undefined);
        await rescanPrivateBalances();
      },
    });
  };

  const promptGenerateAllPOIs = () => {
    setAlert({
      title: 'Generate all Private POIs',
      message:
        'This action will generate all the Private Proofs of Innocence for your transactions, it can take a few minutes.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Generate',
      onSubmit: async () => {
        setAlert(undefined);
        await generateAllPOIs();
      },
    });
  };

  const rescanPrivateBalances = async () => {
    const currentNetwork = network.current;
    setLoadingText(
      `Re-scanning private balances for ${network.current.shortPublicName} across all wallets. You may close this panel. Balances will refresh in the background.`,
    );
    await RailgunTransactionHistorySync.clearSyncedTransactions(
      dispatch,
      currentNetwork.name,
    );

    try {
      await rescanFullUTXOMerkletreesAndWallets(
        currentNetwork.chain,
        wallets.active ? [wallets.active.railWalletID] : undefined,
      );
      setLoadingText(undefined);
      dispatch(
        showImmediateToast({
          type: ToastType.Success,
          message: `Private balances successfully synced with ${currentNetwork.shortPublicName}.`,
        }),
      );
    } catch (cause) {
      const error = new Error('Failed re-scanning private balances', { cause });
      logDevError(error);
      setLoadingText(undefined);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const promptResetTXIDMerkletreesV2 = () => {
    setAlert({
      title: 'Reset TXID data [V2]',
      message:
        'We suggest this action to re-sync RAILGUN TXID data. This action can take a few minutes.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Scan',
      onSubmit: async () => {
        setAlert(undefined);
        await resetTXIDMerkletreesV2();
      },
    });
  };

  const resetTXIDMerkletreesV2 = async () => {
    const currentNetwork = network.current;
    setLoadingText(
      `Resetting TXID data for ${network.current.shortPublicName}. You may close this panel. Data will refresh in the background.`,
    );

    try {
      await resetFullTXIDMerkletreesV2(currentNetwork.chain);
      setLoadingText(undefined);
      dispatch(
        showImmediateToast({
          type: ToastType.Success,
          message: `TXID data synced with ${currentNetwork.shortPublicName}.`,
        }),
      );
    } catch (cause) {
      const error = new Error(
        `Error Resetting TXID data for ${network.current.shortPublicName}`,
        { cause: cause },
      );
      logDevError(error);
      setLoadingText(undefined);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const onSelectReset = () => {
    setAlert({
      title: 'Are you sure?',
      message:
        'This will delete all wallets and reset configurations to defaults. You may re-import your wallets using the seed phrase.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Delete app data',
      buttonPosition: AlertButtonPosition.BottomCenter,
      onSubmit: async () => {
        onResetConfirm();
      },
    });
  };

  const onResetConfirm = () => {
    setAlert({
      title: 'FINAL CONFIRMATION',
      message:
        'WARNING: This action cannot be reversed. Please document seed phrases before resetting your app.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Delete wallets and reset app',
      buttonPosition: AlertButtonPosition.BottomCenter,
      onSubmit: async () => {
        setAlert(undefined);
        await deleteAppData_DANGEROUS();
      },
    });
  };

  const deleteAppData_DANGEROUS = async () => {
    setLoadingText('Updating app settings...');

    try {
      await wipeDevice_DESTRUCTIVE(dispatch, setSettingsAlert);
    } catch (cause) {
      const error = new Error('Error deleting app data. Please try again.', {
        cause,
      });
      logDevError(error);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }

    setLoadingText(undefined);
  };

  const clearLastTransactionNonce = async () => {
    if (!wallets.active || wallets.active.isViewOnlyWallet) {
      return;
    }

    const nonceService = new NonceStorageService();
    await nonceService.clearLastTransactionNonce(
      wallets.active.ethAddress,
      network.current.name,
    );

    setAlert({
      title: 'Cleared stored nonce',
      onClose: () => setAlert(undefined),
    });
  };

  const forceResyncTransactions = async () => {
    await RailgunTransactionHistorySync.resyncAllTransactionsIfNecessary(
      dispatch,
      network.current,
      getWalletTransactionHistory,
      refreshRailgunBalances,
      true,
    );
  };

  const resyncTransactionHistory = async () => {
    setAlert({
      title: 'Cleared transaction history... scanning again',
      onClose: () => setAlert(undefined),
    });

    await forceResyncTransactions();
  };

  const generateAllPOIs = async () => {
    if (!wallets.active) {
      return;
    }
    setLoadingText('Triggering Private POIs...');

    const currentNetwork = network.current;

    try {
      await generateAllPOIsForWallet(
        network.current.name,
        wallets.active?.railWalletID,
      );

      setLoadingText(undefined);

      dispatch(
        showImmediateToast({
          type: ToastType.Success,
          message: `Generated all available Private POIs for ${currentNetwork.shortPublicName}.`,
        }),
      );
    } catch (cause) {
      const error = new Error(
        'Generating Private POIs failed. Please refresh and try again.',
        { cause },
      );
      setLoadingText(undefined);
      logDevError(error);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const appVersionNumber = process.env.REACT_APP_VERSION;

  return (<>
    {isDefined(loadingText) && <FullScreenSpinner text={loadingText} />}
    <div className={styles.settingsListContainer}>
      <div>
        <Text className={styles.sectionHeader}>Manage</Text>
        <ListItem
          title="Wallets"
          description="Add and update wallets"
          className={styles.listItem}
          titleClassName={styles.itemTitle}
          descriptionClassName={styles.itemDescription}
          onPress={() => setWalletSettingsOpen(true)}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.ChevronRight, 18)}
            </div>
          )}
        />
        {poiRequired && (
          <ListItem
            title="Pending balances"
            description="View pending shields and other balances"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            onPress={() => setPendingBalancesOpen(true)}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.ChevronRight, 18)}
              </div>
            )}
          />
        )}
        <ListItem
          title="Networks & RPCs"
          description="Customize network RPCs"
          className={styles.listItem}
          titleClassName={styles.itemTitle}
          descriptionClassName={styles.itemDescription}
          onPress={() => setNetworkSettingsOpen(true)}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.ChevronRight, 18)}
            </div>
          )}
        />
        <ListItem
          title="Address book"
          description="Manage saved addresses"
          className={styles.listItem}
          titleClassName={styles.itemTitle}
          descriptionClassName={styles.itemDescription}
          onPress={() => setSavedAddressesOpen(true)}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.ChevronRight, 18)}
            </div>
          )}
        />
        <ListItem
          title="Public Broadcasters"
          description="Customize public broadcasters"
          className={styles.listItem}
          titleClassName={styles.itemTitle}
          descriptionClassName={styles.itemDescription}
          onPress={() => setBroadcastersSettingsOpen(true)}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.ChevronRight, 18)}
            </div>
          )}
        />
        <ListItem
          title="Default settings"
          description="Set currency for balances"
          className={styles.listItem}
          titleClassName={styles.itemTitle}
          descriptionClassName={styles.itemDescription}
          onPress={() => setDefaultsModalOpen(true)}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.ChevronRight, 18)}
            </div>
          )}
        />
        <ListItem
          title="Change password (DISABLED)"
          description="Set a new password for Railway"
          className={styles.listItemDisabled}
          titleClassName={styles.itemTitle}
          descriptionClassName={styles.itemDescription}
          onPress={() => {}}
        />
      </div>

      <div>
        <Text className={styles.sectionHeader}>Help</Text>
        <a
          href={Constants.RAILWAY_USER_GUIDE}
          target="_blank"
          rel="noreferrer"
          className={styles.titleLink}
        >
          <ListItem
            title="User Guide"
            description="How to use Railway Wallet"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.Help, 18)}
              </div>
            )}
          />
        </a>
        <a
          href={Constants.RAILWAY_SUPPORT_TELEGRAM}
          target="_blank"
          rel="noreferrer"
          className={styles.titleLink}
        >
          <ListItem
            title="Community"
            description="@RailwayWalletBot on Telegram"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.ChatBubble, 18)}
              </div>
            )}
          />
        </a>
        <ListItem
          title="Re-scan private balances"
          description={`Sync RAILGUN balances on ${network.current.shortPublicName}`}
          className={styles.listItem}
          titleClassName={styles.itemTitle}
          descriptionClassName={styles.itemDescription}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.Refresh, 18)}
            </div>
          )}
          onPress={promptRescanPrivateBalances}
        />
        {isDefined(networkForName(network.current.name)?.poi) && (
          <ListItem
            title="Generate all Private POIs"
            description={`Run Private Proof of Innocence for ${network.current.shortPublicName}`}
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.Calculator, 18)}
              </div>
            )}
            onPress={promptGenerateAllPOIs}
          />
        )}
        {ReactConfig.IS_DEV &&
          isDefined(networkForName(network.current.name)?.poi) && (
            <ListItem
              title="[Dev] Reset RAILGUN TXIDs [V2]"
              description={`Clear and sync TXID data on ${network.current.shortPublicName}`}
              className={styles.listItem}
              titleClassName={styles.itemTitle}
              descriptionClassName={styles.itemDescription}
              right={() => (
                <div className={styles.rightContainer}>
                  {renderIcon(IconType.Refresh, 18)}
                </div>
              )}
              onPress={promptResetTXIDMerkletreesV2}
            />
          )}
        <ListItem
          title="Reset wallets"
          description="Reset to app defaults"
          className={styles.listItem}
          titleClassName={styles.itemTitle}
          descriptionClassName={styles.itemDescription}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.Trash, 18)}
            </div>
          )}
          onPress={onSelectReset}
        />
      </div>

      <div>
        <Text className={styles.sectionHeader}>App</Text>
        <a
          href={Constants.DESKTOP_DOWNLOADS_URL}
          target="_blank"
          rel="noreferrer"
          className={styles.titleLink}
        >
          <ListItem
            title="Desktop Downloads"
            description="Get Railway for Mac, Windows, Linux"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.Desktop, 18)}
              </div>
            )}
          />
        </a>
        <a
          href={Constants.PRIVACY_POLICY_URL}
          target="_blank"
          rel="noreferrer"
          className={styles.titleLink}
        >
          <ListItem
            title="Privacy Policy"
            description="View Railway privacy policy"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.Privacy, 18)}
              </div>
            )}
          />
        </a>
        <a
          href={Constants.TERMS_URL}
          target="_blank"
          rel="noreferrer"
          className={styles.titleLink}
        >
          <ListItem
            title="Terms of Use"
            description="View Railway terms of use"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.Terms, 18)}
              </div>
            )}
          />
        </a>
        <ListItem
          title="Wipe Device Data"
          description="Fresh start, all data will be lost"
          className={styles.listItem}
          titleClassName={styles.itemTitle}
          onPress={() => setWipeDeviceDataOpen(true)}
          descriptionClassName={styles.itemDescription}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.Trash, 18)}
            </div>
          )}
        />
      </div>

      {ReactConfig.IS_DEV && (
        <div>
          <Text className={styles.sectionHeader}>Dev only</Text>
          <ListItem
            title={`[Dev] Clear stored nonce: ${network.current.shortPublicName}`}
            description="Reset last transaction nonce"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.Trash, 18)}
              </div>
            )}
            onPress={clearLastTransactionNonce}
          />
          <ListItem
            title={`[Dev] Re-sync transaction history`}
            description="Clear synced RAILGUN history and scan again"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.Refresh, 18)}
              </div>
            )}
            onPress={resyncTransactionHistory}
          />
          <ListItem
            title="[Dev] Private Proof of Innocence Lists"
            description="Add custom Private POI list"
            className={styles.listItem}
            titleClassName={styles.itemTitle}
            descriptionClassName={styles.itemDescription}
            right={() => (
              <div className={styles.rightContainer}>
                {renderIcon(IconType.PlusCircle, 18)}
              </div>
            )}
            onPress={() => setPoiListSettingsOpen(true)}
          />
        </div>
      )}
    </div>
    <footer className={styles.footer}>
      <Text className={styles.footerText}>
        Railway • Version {appVersionNumber}
      </Text>
    </footer>
    {defaultsModalOpen && (
      <SettingsDefaultsModal
        onRequestClose={() => setDefaultsModalOpen(false)}
      />
    )}
    {walletSettingsOpen && (
      <SettingsWalletsModal
        onClose={closeAllModals => {
          setWalletSettingsOpen(false);
          if (closeAllModals && onClose) {
            onClose();
          }
        }}
      />
    )}
    {poiRequired && pendingBalancesOpen && (
      <PendingBalancesModal
        onClose={() => {
          setPendingBalancesOpen(false);
          if (onClose) {
            onClose();
          }
        }}
      />
    )}
    {networkSettingsOpen && (
      <SettingsNetworksModal
        onClose={closeAllModals => {
          setNetworkSettingsOpen(false);
          if (closeAllModals && onClose) {
            onClose();
          }
        }}
      />
    )}
    {savedAddressesOpen && (
      <SettingsSavedAddressesModal
        onClose={closeAllModals => {
          setSavedAddressesOpen(false);
          if (closeAllModals && onClose) {
            onClose();
          }
        }}
      />
    )}
    {poiListSettingsOpen && (
      <POIListsModal
        onClose={closeAllModals => {
          setPoiListSettingsOpen(false);
          if (closeAllModals && onClose) {
            onClose();
          }
        }}
      />
    )}
    {wipeDeviceDataOpen && (
      <WipeDeviceDataModal
        onClose={closeAllModals => {
          setWipeDeviceDataOpen(false);
          if (closeAllModals && onClose) {
            onClose();
          }
        }}
      />
    )}
    {broadcastersSettingsOpen && (
      <SettingsBroadcastersModal
        onClose={closeAllModals => {
          setBroadcastersSettingsOpen(false);
          if (closeAllModals && onClose) {
            onClose();
          }
        }}
      />
    )}
    {changePasswordSettingsOpen && (
      <ChangePasswordModal
        onClose={closeAllModals => {
          setChangePasswordSettingsOpen(false);
          if (closeAllModals && onClose) {
            onClose();
          }
        }}
      />
    )}
    {alert && <GenericAlert {...alert} />}
    {settingsAlert && <GenericAlert {...settingsAlert} />}
    {errorModal && <ErrorDetailsModal {...errorModal} />}
  </>);
};
