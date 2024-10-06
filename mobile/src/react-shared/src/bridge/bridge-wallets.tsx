import {
  Chain,
  NetworkName,
  RailgunWalletInfo,
  TransactionHistoryItem,
} from "@railgun-community/shared-models";
import {
  BridgeCallEvent,
  CreateRailgunWalletParams,
  CreateViewOnlyRailgunWalletParams,
  DeleteRailgunWalletByIDParams,
  GetRailgunAddressParams,
  GetWalletMnemonicParams,
  GetWalletShareableViewingKeyParams,
  GetWalletTransactionHistoryParams,
  LoadRailgunWalletByIDParams,
  RefreshRailgunBalancesParams,
  RescanFullUTXOMerkletreesAndWalletsParams,
  ResetTXIDMerkletreesV2Params,
  SyncRailgunTransactionsV2Params,
  UnloadRailgunWalletByIDParams,
  ValidateRailgunAddressParams,
} from "../models/bridge";
import { bridgeCall } from "./ipc";

export const createRailgunWallet = async (
  encryptionKey: string,
  mnemonic: string,
  creationBlockNumbers: Optional<MapType<number>>
): Promise<RailgunWalletInfo> => {
  const skipBridgeLogs = true;

  return bridgeCall<CreateRailgunWalletParams, RailgunWalletInfo>(
    BridgeCallEvent.CreateRailgunWallet,
    {
      encryptionKey,
      mnemonic,
      creationBlockNumbers,
    },
    skipBridgeLogs
  );
};

export const getWalletMnemonic = async (
  encryptionKey: string,
  railWalletID: string
): Promise<string> => {
  return bridgeCall<GetWalletMnemonicParams, string>(
    BridgeCallEvent.GetWalletMnemonic,
    {
      encryptionKey,
      railWalletID,
    },
    true
  );
};

export const createViewOnlyRailgunWallet = async (
  encryptionKey: string,
  shareableViewingKey: string,
  creationBlockNumbers: Optional<MapType<number>>
): Promise<RailgunWalletInfo> => {
  const skipBridgeLogs = true;

  return bridgeCall<CreateViewOnlyRailgunWalletParams, RailgunWalletInfo>(
    BridgeCallEvent.CreateViewOnlyRailgunWallet,
    {
      encryptionKey,
      shareableViewingKey,
      creationBlockNumbers,
    },
    skipBridgeLogs
  );
};

export const loadRailgunWalletByID = async (
  encryptionKey: string,
  railWalletID: string,
  isViewOnlyWallet: boolean
): Promise<RailgunWalletInfo> => {
  return bridgeCall<LoadRailgunWalletByIDParams, RailgunWalletInfo>(
    BridgeCallEvent.LoadRailgunWalletByID,
    {
      encryptionKey,
      railWalletID,
      isViewOnlyWallet,
    }
  );
};

export const unloadRailgunWalletByID = async (
  railWalletID: string
): Promise<void> => {
  return bridgeCall<UnloadRailgunWalletByIDParams, void>(
    BridgeCallEvent.UnloadRailgunWalletByID,
    {
      railWalletID,
    }
  );
};

export const deleteRailgunWalletByID = async (
  railWalletID: string
): Promise<void> => {
  return bridgeCall<DeleteRailgunWalletByIDParams, void>(
    BridgeCallEvent.DeleteRailgunWalletByID,
    {
      railWalletID,
    }
  );
};

export const validateRailgunAddress = async (
  address: string
): Promise<boolean> => {
  const validated = await bridgeCall<ValidateRailgunAddressParams, boolean>(
    BridgeCallEvent.ValidateRailgunAddress,
    {
      address,
    }
  );
  return validated;
};

export const validateEthAddress = async (address: string): Promise<boolean> => {
  const validated = await bridgeCall<ValidateRailgunAddressParams, boolean>(
    BridgeCallEvent.ValidateEthAddress,
    {
      address,
    }
  );
  return validated;
};

export const getRailgunAddress = (
  railWalletID: string
): Promise<Optional<string>> => {
  return bridgeCall<GetRailgunAddressParams, Optional<string>>(
    BridgeCallEvent.GetRailgunAddress,
    {
      railWalletID,
    }
  );
};

export const getRailgunWalletShareableViewingKey = (
  railWalletID: string
): Promise<Optional<string>> => {
  return bridgeCall<GetWalletShareableViewingKeyParams, Optional<string>>(
    BridgeCallEvent.GetWalletShareableViewingKey,
    {
      railWalletID,
    }
  );
};

export const refreshRailgunBalances = (
  chain: Chain,
  railgunWalletIdFilter: Optional<string[]>
): Promise<void> => {
  return bridgeCall<RefreshRailgunBalancesParams, void>(
    BridgeCallEvent.RefreshRailgunBalances,
    { chain, railgunWalletIdFilter }
  );
};

export const syncRailgunTransactionsV2 = (
  networkName: NetworkName
): Promise<void> => {
  return bridgeCall<SyncRailgunTransactionsV2Params, void>(
    BridgeCallEvent.SyncRailgunTransactionsV2,
    { networkName }
  );
};

export const rescanFullUTXOMerkletreesAndWallets = (
  chain: Chain,
  railgunWalletIdFilter: Optional<string[]>
): Promise<void> => {
  return bridgeCall<RescanFullUTXOMerkletreesAndWalletsParams, void>(
    BridgeCallEvent.RescanFullUTXOMerkletreesAndWallets,
    { chain, railgunWalletIdFilter }
  );
};

export const resetFullTXIDMerkletreesV2 = (chain: Chain): Promise<void> => {
  return bridgeCall<ResetTXIDMerkletreesV2Params, void>(
    BridgeCallEvent.ResetFullTXIDMerkletreesV2,
    { chain }
  );
};

export const getWalletTransactionHistory = (
  chain: Chain,
  railWalletID: string,
  startingBlock: Optional<number>
): Promise<TransactionHistoryItem[]> => {
  return bridgeCall<
    GetWalletTransactionHistoryParams,
    TransactionHistoryItem[]
  >(BridgeCallEvent.GetWalletTransactionHistory, {
    chain,
    railWalletID,
    startingBlock,
  });
};
