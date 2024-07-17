import { bridgeRegisterCall } from '../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  GetChainTxidsStillPendingSpentPOIsParams,
  GetPOIRequiredForNetworkParams,
  GetSpendableReceivedChainTxidsParams,
  type GeneratePOIsForWalletAndRailgunTxidParams,
  type GeneratePOIsForWalletParams,
  type GetTXOsReceivedPOIStatusInfoForWalletParams,
  type GetTXOsSpentPOIStatusInfoForWalletParams,
  type RefreshReceivePOIsForWalletParams,
  type RefreshSpentPOIsForWalletParams,
  type TXOsReceivedPOIStatusInfo,
  type TXOsSpentPOIStatusInfo,
} from '../../bridge/model';
import {
  POIRequired,
  generatePOIsForWallet,
  generatePOIsForWalletAndRailgunTxid,
  getChainTxidsStillPendingSpentPOIs,
  getSpendableReceivedChainTxids,
  getTXOsReceivedPOIStatusInfoForWallet,
  getTXOsSpentPOIStatusInfoForWallet,
  refreshReceivePOIsForWallet,
  refreshSpentPOIsForWallet,
} from '@railgun-community/wallet';

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
