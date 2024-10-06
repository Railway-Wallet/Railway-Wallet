import {
  isDefined,
  MerkletreeScanStatus,
  MerkletreeScanUpdateEvent,
  networkForChain,
  POIProofProgressEvent,
  ProofProgressEvent,
  RailgunBalancesEvent,
} from "@railgun-community/shared-models";
import * as fs from "react-native-fs";
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
  setProofProgress,
  startRailgunEngine,
  store,
  updatePOIProofProgress,
  updateWalletBalancesRailgun,
} from "@react-shared";
import { createDbPath } from "@services/core/db";
import { isAndroid } from "@services/util/platform-os-service";

export const startEngine = async (
  dispatch: AppDispatch,
  remoteConfig?: RemoteConfig
) => {
  let poiNodeUrls: Optional<string[]>;
  if (isDefined(remoteConfig)) {
    poiNodeUrls = [
      remoteConfig.proxyPoiAggregatorUrl,
      ...remoteConfig.publicPoiAggregatorUrls,
    ];
  }

  await startRailgunEngine(
    isAndroid() ? "railway android" : "railway ios",
    await createDbPath(),
    ReactConfig.IS_DEV,
    fs.DocumentDirectoryPath,
    poiNodeUrls
  );

  bridgeListen(
    BridgeEvent.OnBalancesUpdate,
    (balancesEvent: RailgunBalancesEvent) =>
      handleBalancesUpdate(balancesEvent, dispatch)
  );
  bridgeListen(
    BridgeEvent.OnPOIProofProgress,
    (proofProgress: POIProofProgressEvent) =>
      handlePOIProofProgress(proofProgress, dispatch)
  );
  bridgeListen(
    BridgeEvent.OnUTXOMerkletreeScanUpdate,
    (scanUpdateEvent: MerkletreeScanUpdateEvent) =>
      handleMerkletreeScanUpdate(scanUpdateEvent, MerkletreeType.UTXO, dispatch)
  );
  bridgeListen(
    BridgeEvent.OnTXIDMerkletreeScanUpdate,
    (scanUpdateEvent: MerkletreeScanUpdateEvent) =>
      handleMerkletreeScanUpdate(scanUpdateEvent, MerkletreeType.TXID, dispatch)
  );
  bridgeListen(
    BridgeEvent.OnProofProgress,
    (progressEvent: ProofProgressEvent) =>
      handleProofProgress(progressEvent, dispatch)
  );
};

export const handleBalancesUpdate = async (
  {
    txidVersion,
    chain,
    erc20Amounts,
    nftAmounts,
    railgunWalletID,
    balanceBucket,
  }: RailgunBalancesEvent,
  dispatch: AppDispatch
) => {
  if (erc20Amounts.length > 0 && nftAmounts.length > 0) {
    logDev(
      `RAILGUN balance callback (chain ${chain.type}:${chain.id}) - bucket ${balanceBucket}`,
      erc20Amounts,
      nftAmounts
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

  await updateWalletBalancesRailgun(
    dispatch,
    chain,
    railgunWalletID,
    erc20AmountsMap,
    nftAmountsMap
  );
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
  dispatch: AppDispatch
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
    })
  );
};

export const handleMerkletreeScanUpdate = async (
  { scanStatus, chain, progress }: MerkletreeScanUpdateEvent,
  merkletreeType: MerkletreeType,
  dispatch: AppDispatch
) => {
  const network = networkForChain(chain);
  if (!network) {
    return;
  }

  const progressRounded = progress.toFixed(5);
  logDev(`Scan status ${scanStatus}, progress ${progressRounded}`);

  const currentMerkletreeStatus =
    store.getState().merkletreeHistoryScan.forNetwork[network.name]?.forType[
      merkletreeType
    ];
  if (
    isDefined(currentMerkletreeStatus) &&
    currentMerkletreeStatus.status === MerkletreeScanStatus.Complete &&
    progressRounded === (1).toFixed(5)
  ) {
    return;
  }

  dispatch(
    setMerkletreeHistoryScanStatus({
      merkletreeType,
      networkName: network.name,
      status: scanStatus,
      progress,
    })
  );

  if (scanStatus === MerkletreeScanStatus.Complete) {
    await RailgunTransactionHistorySync.safeSyncTransactionHistory(
      dispatch,
      network,
      getWalletTransactionHistory
    );
  }
};

export const handleProofProgress = (
  progressEvent: ProofProgressEvent,
  dispatch: AppDispatch
) => {
  dispatch(setProofProgress(progressEvent));
};
