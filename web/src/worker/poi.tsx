import {
  generatePOIsForWallet,
  getChainTxidsStillPendingSpentPOIs,
  getSpendableReceivedChainTxids,
  getTXOsReceivedPOIStatusInfoForWallet,
  getTXOsSpentPOIStatusInfoForWallet,
  POIRequired,
  refreshReceivePOIsForWallet,
  refreshSpentPOIsForWallet,
} from '@railgun-community/wallet';
import {
  BridgeCallEvent,
  generatePOIsForWalletAndRailgunTxid,
  GeneratePOIsForWalletAndRailgunTxidParams,
  GeneratePOIsForWalletParams,
  GetChainTxidsStillPendingSpentPOIsParams,
  GetPOIRequiredForNetworkParams,
  GetSpendableReceivedChainTxidsParams,
  GetTXOsReceivedPOIStatusInfoForWalletParams,
  GetTXOsSpentPOIStatusInfoForWalletParams,
  RefreshReceivePOIsForWalletParams,
  RefreshSpentPOIsForWalletParams,
  TXOsReceivedPOIStatusInfo,
  TXOsSpentPOIStatusInfo,
} from '@react-shared';
import { bridgeRegisterCall } from './worker-ipc-service';

bridgeRegisterCall<
  GetTXOsReceivedPOIStatusInfoForWalletParams,
  TXOsReceivedPOIStatusInfo[]
>(
  BridgeCallEvent.GetTXOsReceivedPOIStatusInfoForWallet,
  async ({
    txidVersion,
    networkName,
    railWalletID,
  }): Promise<TXOsReceivedPOIStatusInfo[]> => {
    return getTXOsReceivedPOIStatusInfoForWallet(
      txidVersion,
      networkName,
      railWalletID,
    );
  },
);

bridgeRegisterCall<
  GetTXOsSpentPOIStatusInfoForWalletParams,
  TXOsSpentPOIStatusInfo[]
>(
  BridgeCallEvent.GetTXOsSpentPOIStatusInfoForWallet,
  async ({
    txidVersion,
    networkName,
    railWalletID,
  }): Promise<TXOsSpentPOIStatusInfo[]> => {
    return getTXOsSpentPOIStatusInfoForWallet(
      txidVersion,
      networkName,
      railWalletID,
    );
  },
);

bridgeRegisterCall<GetPOIRequiredForNetworkParams, boolean>(
  BridgeCallEvent.GetPOIRequiredForNetwork,
  async ({ networkName }): Promise<boolean> => {
    return POIRequired.isRequiredForNetwork(networkName);
  },
);

bridgeRegisterCall<GetChainTxidsStillPendingSpentPOIsParams, string[]>(
  BridgeCallEvent.GetChainTxidsStillPendingSpentPOIs,
  async ({ txidVersion, networkName, railWalletID }): Promise<string[]> => {
    return getChainTxidsStillPendingSpentPOIs(
      txidVersion,
      networkName,
      railWalletID,
    );
  },
);
bridgeRegisterCall<GetSpendableReceivedChainTxidsParams, string[]>(
  BridgeCallEvent.GetSpendableReceivedChainTxids,
  async ({ txidVersion, networkName, railWalletID }): Promise<string[]> => {
    return getSpendableReceivedChainTxids(
      txidVersion,
      networkName,
      railWalletID,
    );
  },
);

bridgeRegisterCall<GeneratePOIsForWalletAndRailgunTxidParams, void>(
  BridgeCallEvent.GeneratePOIsForWalletAndRailgunTxid,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    railgunTxid,
  }): Promise<void> => {
    return generatePOIsForWalletAndRailgunTxid(
      txidVersion,
      networkName,
      railWalletID,
      railgunTxid,
    );
  },
);

bridgeRegisterCall<GeneratePOIsForWalletParams, void>(
  BridgeCallEvent.GeneratePOIsForWallet,
  async ({ networkName, railWalletID }): Promise<void> => {
    return generatePOIsForWallet(networkName, railWalletID);
  },
);

bridgeRegisterCall<RefreshReceivePOIsForWalletParams, void>(
  BridgeCallEvent.RefreshReceivePOIsForWallet,
  async ({ txidVersion, networkName, railWalletID }): Promise<void> => {
    return refreshReceivePOIsForWallet(txidVersion, networkName, railWalletID);
  },
);

bridgeRegisterCall<RefreshSpentPOIsForWalletParams, void>(
  BridgeCallEvent.RefreshSpentPOIsForWallet,
  async ({
    txidVersion,
    networkName,
    railWalletID,
    railgunTxid,
  }): Promise<void> => {
    return refreshSpentPOIsForWallet(
      txidVersion,
      networkName,
      railWalletID,
      railgunTxid,
    );
  },
);
