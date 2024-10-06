import { NetworkName, TXIDVersion } from "@railgun-community/shared-models";
import {
  BridgeCallEvent,
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
} from "../models/bridge";
import { bridgeCall } from "./ipc";

export const getTXOsReceivedPOIStatusInfoForWallet = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string
): Promise<TXOsReceivedPOIStatusInfo[]> => {
  return bridgeCall<
    GetTXOsReceivedPOIStatusInfoForWalletParams,
    TXOsReceivedPOIStatusInfo[]
  >(BridgeCallEvent.GetTXOsReceivedPOIStatusInfoForWallet, {
    txidVersion,
    networkName,
    railWalletID,
  });
};

export const getTXOsSpentPOIStatusInfoForWallet = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string
): Promise<TXOsSpentPOIStatusInfo[]> => {
  return bridgeCall<
    GetTXOsSpentPOIStatusInfoForWalletParams,
    TXOsSpentPOIStatusInfo[]
  >(BridgeCallEvent.GetTXOsSpentPOIStatusInfoForWallet, {
    txidVersion,
    networkName,
    railWalletID,
  });
};

export const getPOIRequiredForNetwork = (
  networkName: NetworkName
): Promise<boolean> => {
  return bridgeCall<GetPOIRequiredForNetworkParams, boolean>(
    BridgeCallEvent.GetPOIRequiredForNetwork,
    {
      networkName,
    }
  );
};

export const getChainTxidsStillPendingSpentPOIs = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string
): Promise<string[]> => {
  return bridgeCall<GetChainTxidsStillPendingSpentPOIsParams, string[]>(
    BridgeCallEvent.GetChainTxidsStillPendingSpentPOIs,
    {
      txidVersion,
      networkName,
      railWalletID,
    }
  );
};

export const getSpendableReceivedChainTxids = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string
): Promise<string[]> => {
  return bridgeCall<GetSpendableReceivedChainTxidsParams, string[]>(
    BridgeCallEvent.GetSpendableReceivedChainTxids,
    {
      txidVersion,
      networkName,
      railWalletID,
    }
  );
};

export const generatePOIsForWalletAndRailgunTxid = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  railgunTxid: string
): Promise<void> => {
  return bridgeCall<GeneratePOIsForWalletAndRailgunTxidParams, void>(
    BridgeCallEvent.GeneratePOIsForWalletAndRailgunTxid,
    {
      txidVersion,
      networkName,
      railWalletID,
      railgunTxid,
    }
  );
};

export const generateAllPOIsForWallet = (
  networkName: NetworkName,
  railWalletID: string
): Promise<void> => {
  return bridgeCall<GeneratePOIsForWalletParams, void>(
    BridgeCallEvent.GeneratePOIsForWallet,
    {
      networkName,
      railWalletID,
    }
  );
};

export const refreshReceivePOIsForWallet = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string
): Promise<void> => {
  return bridgeCall<RefreshReceivePOIsForWalletParams, void>(
    BridgeCallEvent.RefreshReceivePOIsForWallet,
    {
      txidVersion,
      networkName,
      railWalletID,
    }
  );
};

export const refreshSpentPOIsForWallet = (
  txidVersion: TXIDVersion,
  networkName: NetworkName,
  railWalletID: string,
  railgunTxid?: string
): Promise<void> => {
  return bridgeCall<RefreshSpentPOIsForWalletParams, void>(
    BridgeCallEvent.RefreshSpentPOIsForWallet,
    {
      txidVersion,
      networkName,
      railWalletID,
      railgunTxid,
    }
  );
};
