import {
  isDefined,
  MerkletreeScanStatus,
  RailgunWalletBalanceBucket,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { GenericAlert } from '@components/alerts/GenericAlert/GenericAlert';
import { BroadcasterStatusPanelIndicator } from '@components/BroadcasterStatusPanelIndicator/BroadcasterStatusPanelIndicator';
import { WalletInfoCallout } from '@components/InfoCallout/WalletInfoCallout/WalletInfoCallout';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { useMainScreenAlertMessage } from '@hooks/useMainScreenAlertMessage';
import { useWalletCreationModals } from '@hooks/useWalletCreationModals';
import {
  MerkletreeType,
  refreshRailgunBalances,
  SharedConstants,
  StorageService,
  syncRailgunTransactionsV2,
  useBalancePriceRefresh,
  useMemoCustomCompare,
  useReduxSelector,
  WalletCardSlideItem} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { OmittedPrivateTokensModal } from '@views/screens/modals/OmittedPrivateTokensModal/OmittedPrivateTokensModal';
import { RPCsSetUpModal } from '@views/screens/modals/RPCsSetUpModal/RPCsSetUpModal';
import { ERC20BasicList } from './ERC20BasicList/ERC20BasicList';
import { ERC20BasicListHeader } from './ERC20BasicList/ERC20BasicListHeader/ERC20BasicListHeader';
import { ERC20TokenListLoading } from './ERC20TokenListLoading/ERC20TokenListLoading';
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
  const { merkletreeHistoryScan } = useReduxSelector('merkletreeHistoryScan');
  const { discreetMode } = useReduxSelector('discreetMode');
  const { proofBatcher } = useReduxSelector('proofBatcher');

  const { isRailgun } = slideItem;
  const balanceBucketFilter = useMemo(() => 
    [RailgunWalletBalanceBucket.Spendable], 
    []
  );

  const [scanProgress, setScanProgress] = useState({
    balance: 0,
    txid: 0,
    batchList: ''
  });


  useEffect(() => {
    const utxoData = merkletreeHistoryScan.forNetwork[network.current.name]?.forType[MerkletreeType.UTXO];
    const txidData = merkletreeHistoryScan.forNetwork[network.current.name]?.forType[MerkletreeType.TXID];
    const newBalanceProgress = utxoData?.progress ?? 0;
    const newTxidProgress = Math.floor((txidData?.progress ?? 0) / 5) * 5;
    const newBatchProgress = proofBatcher?.status ?? '';

    if (
      newBalanceProgress !== scanProgress.balance ||
      newTxidProgress !== scanProgress.txid ||
      newBatchProgress !== scanProgress.batchList
    ) {
      setScanProgress({
        balance: newBalanceProgress,
        txid: newTxidProgress,
        batchList: newBatchProgress
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }}, [merkletreeHistoryScan, network.current.name, proofBatcher?.status]);
  
  const scanStatus = useMemoCustomCompare(
    {
      railgunBalancesUpdating: 
        merkletreeHistoryScan.forNetwork[network.current.name]?.forType[MerkletreeType.UTXO]?.status === MerkletreeScanStatus.Started ||
        merkletreeHistoryScan.forNetwork[network.current.name]?.forType[MerkletreeType.UTXO]?.status === MerkletreeScanStatus.Updated,
      txidsUpdating:
        merkletreeHistoryScan.forNetwork[network.current.name]?.forType[MerkletreeType.TXID]?.status === MerkletreeScanStatus.Started ||
        merkletreeHistoryScan.forNetwork[network.current.name]?.forType[MerkletreeType.TXID]?.status === MerkletreeScanStatus.Updated,
      batchListUpdating:
        isDefined(proofBatcher) &&
        isDefined(proofBatcher.status) &&
        proofBatcher.status !== '' &&
        !proofBatcher.status?.includes('100.00%')
    },
    (prev, next) => {
      return prev.railgunBalancesUpdating === next.railgunBalancesUpdating &&
             prev.txidsUpdating === next.txidsUpdating &&
             prev.batchListUpdating === next.batchListUpdating;
    }
  );

  const {
    omittedPrivateTokens: {
      omittedPrivateTokens,
      shouldShowOmittedPrivateTokensModal,
    },
  } = useReduxSelector('omittedPrivateTokens');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.current.name]);

  const refreshBalances = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    await pullPrices();

    if (isDefined(wallets.active)) {      
      await pullBalances();
    }
    setIsRefreshing(false);
    if (
      txidVersion.current === TXIDVersion.V2_PoseidonMerkle &&
      isDefined(wallets.active)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      syncRailgunTransactionsV2(network.current.name);
    }
  };

  const hideBroadcasterStatus =
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
        {!hideBroadcasterStatus && <BroadcasterStatusPanelIndicator />}
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
          {scanStatus.railgunBalancesUpdating && isRailgun && (
            <ERC20TokenListLoading
              title="RAILGUN balances updating"
              progress={scanProgress.balance}
            />
          )}
          {!scanStatus.railgunBalancesUpdating && scanStatus.txidsUpdating && isRailgun && (
            <ERC20TokenListLoading
              title="RAILGUN TXIDs updating"
              progress={scanProgress.txid}
            />
          )}
          {!scanStatus.railgunBalancesUpdating && !scanStatus.txidsUpdating && scanStatus.batchListUpdating && (
            <ERC20TokenListLoading 
              title={scanProgress.batchList} 
            />
          )}
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
