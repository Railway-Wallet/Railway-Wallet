import {
  isDefined,
  MerkletreeScanStatus,
  MerkletreeScanUpdateEvent,
  networkForChain,
  POIProofProgressEvent,
  ProofProgressEvent,
  RailgunBalancesEvent,
} from '@railgun-community/shared-models';
import { BatchListUpdateEvent } from '@railgun-community/wallet';
import {
  AppDispatch,
  BridgeEvent,
  bridgeListen,
  createSerializedNFTAmounts,
  getWalletTransactionHistory,
  logDev,
  MerkletreeType,
  RailgunERC20AmountMap,
  RailgunNFTAmountsMap,
  RailgunTransactionHistorySync,
  ReactConfig,
  RemoteConfig,
  setMerkletreeHistoryScanStatus,
  setProofBatchProgress,
  setProofProgress,
  startRailgunEngine,
  store,
  updatePOIProofProgress,
  updateWalletBalancesRailgun,
} from '@react-shared';
import { isElectron } from '@utils/user-agent';

const DB_PATH = 'lepton.db';

let displayBatchListCallback: () => Promise<void>;

export const startEngine = async (
  dispatch: AppDispatch,
  remoteConfig?: RemoteConfig,
) => {
  let poiNodeUrls: Optional<string[]>;
  if (isDefined(remoteConfig)) {
    poiNodeUrls = [
      remoteConfig.proxyPoiAggregatorUrl,
      ...remoteConfig.publicPoiAggregatorUrls,
    ];
  }

  await startRailgunEngine(
    isElectron() ? 'railway desktop' : 'railway web',
    DB_PATH,
    ReactConfig.IS_DEV,
    undefined, poiNodeUrls,
  );

  bridgeListen(
    BridgeEvent.OnBalancesUpdate,
    (balancesEvent: RailgunBalancesEvent) =>
      handleBalancesUpdate(balancesEvent, dispatch),
  );
  bridgeListen(
    BridgeEvent.OnPOIProofProgress,
    (proofProgress: POIProofProgressEvent) =>
      handlePOIProofProgress(proofProgress, dispatch),
  );
  bridgeListen(
    BridgeEvent.OnUTXOMerkletreeScanUpdate,
    (scanUpdateEvent: MerkletreeScanUpdateEvent) =>
      handleMerkletreeScanUpdate(
        scanUpdateEvent,
        MerkletreeType.UTXO,
        dispatch,
      ),
  );
  bridgeListen(
    BridgeEvent.OnTXIDMerkletreeScanUpdate,
    (scanUpdateEvent: MerkletreeScanUpdateEvent) =>
      handleMerkletreeScanUpdate(
        scanUpdateEvent,
        MerkletreeType.TXID,
        dispatch,
      ),
  );
  bridgeListen(
    BridgeEvent.OnProofProgress,
    (progressEvent: ProofProgressEvent) =>
      handleProofProgress(progressEvent, dispatch),
  );

  bridgeListen(
    BridgeEvent.OnBatchListCallback,
    (batchListUpdateEvent: BatchListUpdateEvent) =>
      handleBatchListCallback(batchListUpdateEvent, dispatch),
  );
};

const handleBalancesUpdate = async (
  {
    txidVersion,
    chain,
    erc20Amounts,
    nftAmounts,
    railgunWalletID,
    balanceBucket,
  }: RailgunBalancesEvent,
  dispatch: AppDispatch,
) => {
  if (erc20Amounts.length > 0 && nftAmounts.length > 0) {
    logDev(
      `RAILGUN balance callback (chain ${chain.type}:${chain.id}) - bucket ${balanceBucket}`,
      erc20Amounts,
      nftAmounts,
    );
  }

  const erc20AmountsMap: RailgunERC20AmountMap = {
    [txidVersion]: {
      [balanceBucket]: erc20Amounts,
    },
  };

  const nftAmountsSerialized = createSerializedNFTAmounts(nftAmounts);
  const nftAmountsMap: RailgunNFTAmountsMap = {
    [txidVersion]: {
      [balanceBucket]: nftAmountsSerialized,
    },
  };

  displayBatchListCallback = async () => {
    await updateWalletBalancesRailgun(
      dispatch,
      chain,
      railgunWalletID,
      erc20AmountsMap,
      nftAmountsMap,
    );
  };

  await displayBatchListCallback();
};

const handlePOIProofProgress = (
  {
    status,
    chain,
    txidVersion,
    railgunWalletID,
    progress,
    listKey,
    txid,
    railgunTxid,
    index,
    totalCount,
    errMessage,
  }: POIProofProgressEvent,
  dispatch: AppDispatch,
) => {
  const network = networkForChain(chain);
  if (!network) {
    return;
  }

  dispatch(
    updatePOIProofProgress({
      networkName: network.name,
      txidVersion,
      walletID: railgunWalletID,
      status,
      progress,
      listKey,
      txid,
      railgunTxid,
      index,
      totalCount,
      errMessage,
    }),
  );
};

const handleMerkletreeScanUpdate = async (
  { scanStatus, chain, progress }: MerkletreeScanUpdateEvent,
  merkletreeType: MerkletreeType,
  dispatch: AppDispatch,
) => {
  const network = networkForChain(chain);
  if (!network) {
    return;
  }

  const progressRounded = progress.toFixed(2);
  logDev(
    `Scan status for ${merkletreeType} merkletree: ${scanStatus}, progress ${progressRounded}. Chain: ${chain.id}`,
  );

  const merkletreeStatus =
    store.getState().merkletreeHistoryScan.forNetwork[network.name]?.forType[
      merkletreeType
    ];
  if (
    isDefined(merkletreeStatus) &&
    merkletreeStatus.status === MerkletreeScanStatus.Complete &&
    progressRounded === (1).toFixed(2)
  ) {
    return;
  }

    dispatch(
      setMerkletreeHistoryScanStatus({
        merkletreeType,
        networkName: network.name,
        status: scanStatus,
        progress: parseFloat(progressRounded),
      }),
    );


  if (scanStatus === MerkletreeScanStatus.Complete) {
    await RailgunTransactionHistorySync.safeSyncTransactionHistory(
      dispatch,
      network,
      getWalletTransactionHistory,
    );
  }
};

const handleProofProgress = async (
  progressEvent: ProofProgressEvent,
  dispatch: AppDispatch,
) => {
  const progressRounded = progressEvent.progress.toFixed(5);
  
  if (
    isDefined(displayBatchListCallback) &&
    progressRounded === (100).toFixed(5)
  ) {
    await displayBatchListCallback();
  }

  dispatch(setProofProgress(progressEvent));
};

const handleBatchListCallback = async (
  event: BatchListUpdateEvent,
  dispatch: AppDispatch,
) => {
  const proofProgress = {
    progress: event.percent,
    status: event.status,
  };
  const progressRounded = proofProgress.progress.toFixed(5);

  if (
    isDefined(displayBatchListCallback) &&
    progressRounded === (100).toFixed(5)
  ) {
    await displayBatchListCallback();
  }

  dispatch(setProofBatchProgress(proofProgress));
};
