import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Input } from '@components/Input/Input';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { useSetActiveWallet } from '@hooks/useSetActiveWallet';
import {
  FrontendWallet,
  SharedConstants,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  useReduxSelector,
  validateWalletName,
  WalletService,
  WalletStorageService,
  WalletTokenService,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { ExportWalletAlert } from '@screens/modals/ExportWalletAlert/ExportWalletAlert';
import { ShowSeedPhraseModal } from '@screens/modals/ShowSeedPhraseModal/ShowSeedPhraseModal';
import { ShowShareableViewingKeyModal } from '@screens/modals/ShowShareableViewingKeyModal/ShowShareableViewingKeyModal';
import { IconType, renderIcon } from '@services/util/icon-service';
import { WalletSecureStorageWeb } from '@services/wallet/wallet-secure-service-web';
import { copyToClipboard } from '@utils/clipboard';
import { DeleteWalletModal } from '../DeleteWalletModal/DeleteWalletModal';
import { EditWalletNameModal } from '../EditWalletNameModal/EditWalletNameModal';
import styles from './SettingsWalletInfoModal.module.scss';

type Props = {
  wallet?: FrontendWallet;
  onClose: (closeAllModals: boolean) => void;
};

export const SettingsWalletInfoModal = ({
  onClose,
  wallet: originalWallet,
}: Props) => {
  const { wallets } = useReduxSelector('wallets');

  const [wallet, setWallet] = useState(originalWallet);
  const [showEditWalletNameModal, setShowEditWalletNameModal] = useState(false);
  const [showExportWalletAlert, setShowExportWalletAlert] = useState(false);

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showShareableViewingKey, setShowShareableViewingKey] = useState(false);
  const [showDeleteWallet, setShowDeleteWallet] = useState(false);
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [modalContentRef, setModalContentRef] =
    useState<Optional<HTMLDivElement>>(undefined);

  const shouldCloseOnSetActiveWallet = useRef(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    setWallet(originalWallet);
  }, [originalWallet]);

  useEffect(() => {
    if (isDefined(wallets.active) && shouldCloseOnSetActiveWallet.current) {
      shouldCloseOnSetActiveWallet.current = false;
      const closeAllModals = false;
      onClose(closeAllModals);
    }
  }, [wallets.active?.id, onClose]);

  const {
    setActiveWallet,
    showEnterPassword,
    setShowEnterPassword,
    authKey,
    setAuthKey,
    isLoading,
    setIsLoading,
  } = useSetActiveWallet(setWallet);

  const promptResetTokens = () => {
    if (!wallet) {
      return;
    }
    setAlert({
      title: 'Reset tokens to defaults?',
      message:
        'Any balances will be stored. You may add tokens back at any time.',
      onClose: () => setAlert(undefined),
      onSubmit: async () => {
        const walletTokenService = new WalletTokenService(dispatch);
        await walletTokenService.resetTokensToDefaults(wallet);
        setAlert(undefined);
      },
      submitTitle: 'Reset',
    });
  };

  const updateWalletName = async (newWalletName?: string) => {
    setShowEditWalletNameModal(false);
    if (!isDefined(newWalletName) || !isDefined(wallet)) {
      return;
    }
    if (!validateWalletName(newWalletName)) {
      setAlert({
        title: 'Invalid entry',
        message: 'Please enter a valid wallet name.',
        onClose: () => setAlert(undefined),
      });
      return;
    }
    if (newWalletName.length > SharedConstants.MAX_LENGTH_WALLET_NAME) {
      setAlert({
        title: 'Invalid entry',
        message: `Wallet name is limited to ${SharedConstants.MAX_LENGTH_WALLET_NAME} characters.`,
        onClose: () => setAlert(undefined),
      });
      return;
    }
    if (!isDefined(authKey)) {
      setAlert({
        title: 'Error',
        message: 'No auth key found. Please refresh.',
        onClose: () => setAlert(undefined),
      });
      return;
    }
    const walletStorageService = new WalletStorageService(dispatch);
    const newWallet = { ...wallet, name: newWalletName };
    await walletStorageService.updateWallet(newWallet);
    setWallet(newWallet);
  };

  const deleteWallet = async () => {
    if (modalContentRef) {
      modalContentRef.scrollTop = 0;
    }

    setShowDeleteWallet(false);
    if (!isDefined(authKey) || !wallet) {
      return;
    }

    setIsLoading(true);
    const walletService = new WalletService(
      dispatch,
      new WalletSecureStorageWeb(authKey),
    );

    const isActiveWallet = wallet.isActive;
    const skipUpdatingActiveWallet = true;
    await walletService.removeWallet(wallet.id, skipUpdatingActiveWallet);
    const firstWallet = walletService.getFirstFrontendWallet();
    if (isActiveWallet && isDefined(firstWallet)) {
      shouldCloseOnSetActiveWallet.current = true;
      await setActiveWallet(firstWallet);
    } else {
      setIsLoading(false);
      const closeAllModals = false;
      onClose(closeAllModals);
    }
  };

  const onTapCopyAddress = async (address: string, addressType: string) => {
    await copyToClipboard(address);
    dispatch(
      showImmediateToast({
        message: `${addressType} address copied. Paste elsewhere to share.`,
        type: ToastType.Copy,
      }),
    );
  };

  const activeHeader =
    wallet && wallet.isActive ? 'Wallet is Active' : 'Set as Active Wallet';

  const activeSubheader =
    wallet?.isViewOnlyWallet ?? false
      ? 'Use this wallet for balances'
      : 'Use this wallet for balances and transactions';

  const enterPasswordModal = (
    <>
      {!isDefined(authKey) && (
        <EnterPasswordModal
          success={authKey => setAuthKey(authKey)}
          onDismiss={() => {
            setShowDeleteWallet(false);
            setShowEditWalletNameModal(false);
          }}
        />
      )}
    </>
  );

  return (<>
    <GenericModal
      onClose={() => onClose(false)}
      isBackChevron={true}
      setModalContentRef={setModalContentRef}
    >
      {wallet && (
        <>
          <div
            className={cn(
              {
                [styles.activeWalletButton]: true,
                [styles.disabled]: isDefined(wallet) && wallet.isActive,
              },
              styles.itemCard,
              styles.activeWalletCard,
              styles.clickable,
            )}
            onClick={() => setActiveWallet(wallet)}
          >
            <div className={styles.cardHeaderContainer}>
              <Text className={styles.headerText}>{activeHeader}</Text>
              {wallet.isActive &&
                renderIcon(
                  wallet.isViewOnlyWallet ? IconType.Eye : IconType.Wallet,
                  18,
                )}
            </div>
            <Text className={styles.label}>{activeSubheader}</Text>
          </div>
          <Text className={styles.sectionHeader}>Name</Text>
          <Input
            value={wallet.name ?? ''}
            onPress={() => {
              setShowEditWalletNameModal(true);
            }}
            onChange={() => {}}
            endIcon={IconType.Edit}
            iconSize={18}
            iconClassName={styles.editIcon}
          />
          <Text className={styles.sectionHeader}>Details</Text>
          <div className={styles.itemCard}>
            <div className={styles.itemInnerContainer}>
              <div className={styles.flexContainer}>
                <Text className={styles.subheader}>Shielded Address</Text>
                {renderIcon(IconType.Shield, 18)}
              </div>
              <div
                className={styles.cursor}
                onClick={() =>
                  onTapCopyAddress(wallet.railAddress, 'RAILGUN')
                }
              >
                {renderIcon(IconType.Copy)}
              </div>
            </div>
            <Text className={styles.label}>{wallet.railAddress}</Text>
          </div>

          {!wallet.isViewOnlyWallet && (
            <>
              <div
                className={cn(
                  styles.itemCard,
                  styles.itemContainerUpperSpacing,
                )}
              >
                <div className={styles.itemInnerContainer}>
                  <div className={styles.flexContainer}>
                    <Text className={styles.subheader}>
                      Public Address (EVM)
                    </Text>
                    {renderIcon(IconType.Public, 18)}
                  </div>
                  <div
                    className={styles.cursor}
                    onClick={() =>
                      onTapCopyAddress(wallet.ethAddress, 'Public EVM')
                    }
                  >
                    {renderIcon(IconType.Copy)}
                  </div>
                </div>
                <Text className={styles.label}>{wallet.ethAddress}</Text>
              </div>
              {isDefined(wallet.derivationIndex) && (
                <div
                  className={cn(
                    styles.itemCard,
                    styles.itemContainerUpperSpacing,
                  )}
                >
                  <div className={styles.itemInnerContainer}>
                    <div className={styles.flexContainer}>
                      <Text className={styles.subheader}>
                        Derivation index
                      </Text>
                    </div>
                  </div>
                  <Text className={cn(styles.label, styles.marginTop)}>
                    {wallet.derivationIndex}
                  </Text>
                </div>
              )}
            </>
          )}
          {!wallet.isViewOnlyWallet && (
            <>
              <Text className={styles.sectionHeader}>Backup options</Text>
              <div
                className={cn(styles.itemCard, styles.clickable)}
                onClick={() => setShowSeedPhrase(true)}
              >
                <div className={styles.phraseHeader}>
                  <Text>Show Seed Phrase</Text>
                  {renderIcon(IconType.ChevronRight, 16)}
                </div>
                <Text className={styles.label}>
                  If you lose access to this device, your funds could be lost.
                  Please make copies of your seed phrase offline.
                </Text>
              </div>
              <div
                className={cn(
                  styles.itemCard,
                  styles.marginTop,
                  styles.clickable,
                )}
                onClick={() => setShowExportWalletAlert(true)}
              >
                <div className={styles.phraseHeader}>
                  <Text>Export Wallet</Text>
                  {renderIcon(IconType.ChevronRight, 16)}
                </div>
                <Text className={styles.label}>
                  This option will export your wallet into a backup file so
                  you can import it again whenever is needed.
                </Text>
              </div>
            </>
          )}
          <Text className={styles.sectionHeader}>Sharing options</Text>
          <div
            className={cn(styles.itemCard, styles.clickable)}
            onClick={() => setShowShareableViewingKey(true)}
          >
            <div className={styles.phraseHeader}>
              <Text>Show View-Only Private Key</Text>
              {renderIcon(IconType.ChevronRight, 16)}
            </div>
            <Text className={styles.label}>
              This key gives full viewing access to your entire transaction
              history. Once shared, it cannot be revoked.
            </Text>
          </div>
          <Text className={styles.sectionHeader}>Reset wallet</Text>
          <div
            className={cn(styles.itemCard, styles.clickable)}
            onClick={promptResetTokens}
          >
            <div className={styles.flexContainer}>
              <Text className={styles.subheader}>
                Reset tokens to defaults
              </Text>
              {renderIcon(IconType.Refresh, 18)}
            </div>
          </div>
          <div
            className={cn(
              styles.itemCard,
              styles.marginTop,
              styles.clickable,
            )}
            onClick={() => setShowDeleteWallet(true)}
          >
            <div className={styles.flexContainer}>
              <Text className={styles.danger}>Remove this wallet</Text>
              {renderIcon(IconType.Trash, 18)}
            </div>
          </div>
        </>
      )}
      {isLoading && <FullScreenSpinner />}
    </GenericModal>
    {showDeleteWallet && (
      <>
        {isDefined(authKey) && (
          <DeleteWalletModal
            onRequestClose={() => setShowDeleteWallet(false)}
            handleDeleteWallet={deleteWallet}
          />
        )}
        {}
        {enterPasswordModal}
      </>
    )}
    {showSeedPhrase && wallet && (
      <>
        {}
        <ShowSeedPhraseModal
          onClose={() => setShowSeedPhrase(false)}
          wallet={wallet}
        />
      </>
    )}
    {showExportWalletAlert && wallet && (
      <>
        {}
        <ExportWalletAlert
          onClose={() => setShowExportWalletAlert(false)}
          wallet={wallet}
        />
      </>
    )}
    {showShareableViewingKey && wallet && (
      <>
        {}
        <ShowShareableViewingKeyModal
          onClose={() => setShowShareableViewingKey(false)}
          wallet={wallet}
        />
      </>
    )}
    {showEditWalletNameModal && wallet && (
      <>
        {isDefined(authKey) && (
          <EditWalletNameModal
            previousWalletName={wallet.name}
            onClose={() => setShowEditWalletNameModal(false)}
            onComplete={updateWalletName}
          />
        )}
        {}
        {enterPasswordModal}
      </>
    )}
    {alert && <GenericAlert {...alert} />}
    {showEnterPassword && !isDefined(authKey) && (
      <EnterPasswordModal
        success={authKey => {
          setAuthKey(authKey);
          setShowEnterPassword(false);
        }}
        onDismiss={() => setShowEnterPassword(false)}
        descriptionText="Your password is required to load this encrypted wallet."
      />
    )}
  </>);
};
