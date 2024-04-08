import {
  isDefined,
  RailgunWalletBalanceBucket,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import cn from 'classnames';
import { GenericAlert } from '@components/alerts/GenericAlert/GenericAlert';
import { WalletInfoCallout } from '@components/InfoCallout/WalletInfoCallout/WalletInfoCallout';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { RelayerStatusPanelIndicator } from '@components/RelayerStatusPanelIndicator/RelayerStatusPanelIndicator';
import { useMainScreenAlertMessage } from '@hooks/useMainScreenAlertMessage';
import { useWalletCreationModals } from '@hooks/useWalletCreationModals';
import {
  refreshRailgunBalances,
  SharedConstants,
  StorageService,
  syncRailgunTransactionsV2,
  useBalancePriceRefresh,
  useReduxSelector,
  WalletCardSlideItem,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { OmittedPrivateTokensModal } from '@views/screens/modals/OmittedPrivateTokensModal/OmittedPrivateTokensModal';
import { RPCsSetUpModal } from '@views/screens/modals/RPCsSetUpModal/RPCsSetUpModal';
import { ERC20BasicList } from './ERC20BasicList/ERC20BasicList';
import { ERC20BasicListHeader } from './ERC20BasicList/ERC20BasicListHeader/ERC20BasicListHeader';
import { WalletInfoButtonsCard } from './WalletInfoButtonsCard/WalletInfoButtonsCard';
import { WalletStatusBar } from './WalletStatusBar/WalletStatusBar';
import styles from './WalletsScreen.module.scss';

type Props = {
  slideItem: WalletCardSlideItem;
  setIsRailgun: (isRailgun: boolean) => void;
  setShowWalletSelectorModal: (show: boolean) => void;
};

export enum TokenActionType {
  SEND_TOKENS = 'SEND_TOKENS',
  RECEIVE_TOKENS = 'RECEIVE_TOKENS',
  SHIELD_TOKENS = 'SHIELD_TOKENS',
  UNSHIELD_TOKENS = 'UNSHIELD_TOKENS',
  IMPORT_WALLET = 'IMPORT_WALLET',
  CREATE_WALLET = 'CREATE_WALLET',
  MINT_TEST_TOKENS = 'MINT_TEST_TOKENS',
}

export const WalletsScreen = ({
  slideItem,
  setIsRailgun,
  setShowWalletSelectorModal,
}: Props) => {
  const { wallets } = useReduxSelector('wallets');
  const { network } = useReduxSelector('network');
  const { txidVersion } = useReduxSelector('txidVersion');
  const {
    omittedPrivateTokens: {
      omittedPrivateTokens,
      shouldShowOmittedPrivateTokensModal,
    },
  } = useReduxSelector('omittedPrivateTokens');
  const { discreetMode } = useReduxSelector('discreetMode');

  const { isRailgun } = slideItem;

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  const [tokenSearchText, setTokenSearchText] = useState('');
  const [showOmittedPrivateTokensModal, setShowOmittedPrivateTokensModal] =
    useState(false);
  const [showRPCsSetUpModal, setShowRPCsSetUpModal] = useState(false);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { mainScreenAlert } = useMainScreenAlertMessage();

  const { pullPrices, pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      }),
  );

  const showBackChevron = false;
  const {
    showCreatePassword,
    showImportWallet,
    showCreateWallet,
    createPasswordModal,
    createWalletModal,
    importWalletModal,
    seedPhraseCalloutModal,
    viewingKeyCalloutModal,
    newWalletSuccessModal,
  } = useWalletCreationModals(showBackChevron);

  useEffect(() => {
    if (shouldShowOmittedPrivateTokensModal) {
      setShowOmittedPrivateTokensModal(true);
    } else {
      setShowOmittedPrivateTokensModal(false);
    }
  }, [shouldShowOmittedPrivateTokensModal]);

  useEffect(() => {
    const checkShouldShowSetRPCsSetUpModal = async () => {
      const rpcSetUpKey =
        SharedConstants.HAS_SEEN_RPC_SET_UP + '_' + network.current.name;
      const hasSeen = await StorageService.getItem(rpcSetUpKey);
      if (!isDefined(hasSeen)) {
        setShowRPCsSetUpModal(true);
        await StorageService.setItem(rpcSetUpKey, '1');
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkShouldShowSetRPCsSetUpModal();
  }, [network.current.name]);

  const refreshBalances = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    await pullPrices();
    await pullBalances();
    setIsRefreshing(false);
    if (
      txidVersion.current === TXIDVersion.V2_PoseidonMerkle &&
      isDefined(wallets.active)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      syncRailgunTransactionsV2(network.current.name);
    }
  };

  const hideRelayerStatus =
    isDefined(wallets.active) && wallets.active.isViewOnlyWallet;

  return (
    <div className={styles.walletScreenContainer}>
      <WalletStatusBar
        isRailgun={isRailgun}
        displayingAssetDescription="token balances"
        setIsRailgun={setIsRailgun}
        setShowWalletSelectorModal={setShowWalletSelectorModal}
      />
      <div className={cn(styles.container, 'hide-scroll')}>
        {!hideRelayerStatus && <RelayerStatusPanelIndicator />}
        <div className={styles.innerContainer}>
          <WalletInfoCallout balanceBucketFilter={balanceBucketFilter} />
          <WalletInfoButtonsCard
            slideItem={slideItem}
            showCreatePassword={showCreatePassword}
            showCreateWallet={showCreateWallet}
            showImportWallet={showImportWallet}
            setShowWalletSelectorModal={setShowWalletSelectorModal}
            balanceBucketFilter={balanceBucketFilter}
            discreet={discreetMode.enabled}
          />
        </div>
        <MainPagePaddedContainer>
          <ERC20BasicListHeader
            isRailgun={isRailgun}
            refreshBalances={refreshBalances}
            onSearchChange={text => setTokenSearchText(text)}
          />
        </MainPagePaddedContainer>
        <ERC20BasicList
          isRailgun={isRailgun}
          tokenSearchText={tokenSearchText}
          balanceBucketFilter={balanceBucketFilter}
        />
      </div>
      {createPasswordModal}
      {createWalletModal}
      {importWalletModal}
      {seedPhraseCalloutModal}
      {viewingKeyCalloutModal}
      {newWalletSuccessModal}
      {mainScreenAlert && <GenericAlert {...mainScreenAlert} />}
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
      {showOmittedPrivateTokensModal && (
        <OmittedPrivateTokensModal
          amount={omittedPrivateTokens.length}
          onClose={() => setShowOmittedPrivateTokensModal(false)}
        />
      )}
      {showRPCsSetUpModal && (
        <RPCsSetUpModal
          selectedNetwork={network.current}
          onClose={() => setShowRPCsSetUpModal(false)}
        />
      )}
    </div>
  );
};
