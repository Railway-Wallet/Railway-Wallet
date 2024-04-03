import {
  RailgunWalletInfo,
  TransactionHistoryItem,
} from '@railgun-community/shared-models';
import {
  createRailgunWallet,
  createViewOnlyRailgunWallet,
  deleteWalletByID,
  getRailgunAddress,
  getWalletMnemonic,
  getWalletShareableViewingKey,
  getWalletTransactionHistory,
  loadWalletByID,
  refreshBalances,
  rescanFullUTXOMerkletreesAndWallets,
  resetFullTXIDMerkletreesV2,
  syncRailgunTransactionsV2,
  unloadWalletByID,
  validateEthAddress,
  validateRailgunAddress,
} from '@railgun-community/wallet';
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
 SyncRailgunTransactionsV2Params,  UnloadRailgunWalletByIDParams,
  ValidateEthAddressParams,
  ValidateRailgunAddressParams } from '@react-shared';
import { bridgeRegisterCall } from './worker-ipc-service';

bridgeRegisterCall<LoadRailgunWalletByIDParams, RailgunWalletInfo>(
  BridgeCallEvent.LoadRailgunWalletByID,
  ({
    encryptionKey,
    railWalletID,
    isViewOnlyWallet,
  }): Promise<RailgunWalletInfo> => {
    return loadWalletByID(encryptionKey, railWalletID, isViewOnlyWallet);
  },
);

bridgeRegisterCall<UnloadRailgunWalletByIDParams, void>(
  BridgeCallEvent.UnloadRailgunWalletByID,
  async ({ railWalletID }): Promise<void> => {
    return unloadWalletByID(railWalletID);
  },
);

bridgeRegisterCall<DeleteRailgunWalletByIDParams, void>(
  BridgeCallEvent.DeleteRailgunWalletByID,
  async ({ railWalletID }): Promise<void> => {
    return deleteWalletByID(railWalletID);
  },
);

bridgeRegisterCall<GetWalletMnemonicParams, string>(
  BridgeCallEvent.GetWalletMnemonic,
  async ({ encryptionKey, railWalletID }): Promise<string> => {
    return getWalletMnemonic(encryptionKey, railWalletID);
  },
);

bridgeRegisterCall<CreateRailgunWalletParams, RailgunWalletInfo>(
  BridgeCallEvent.CreateRailgunWallet,
  async ({
    encryptionKey,
    mnemonic,
    creationBlockNumbers,
  }): Promise<RailgunWalletInfo> => {
    return createRailgunWallet(encryptionKey, mnemonic, creationBlockNumbers);
  },
);

bridgeRegisterCall<CreateViewOnlyRailgunWalletParams, RailgunWalletInfo>(
  BridgeCallEvent.CreateViewOnlyRailgunWallet,
  async ({
    encryptionKey,
    shareableViewingKey,
    creationBlockNumbers,
  }): Promise<RailgunWalletInfo> => {
    return createViewOnlyRailgunWallet(
      encryptionKey,
      shareableViewingKey,
      creationBlockNumbers,
    );
  },
);

bridgeRegisterCall<GetWalletTransactionHistoryParams, TransactionHistoryItem[]>(
  BridgeCallEvent.GetWalletTransactionHistory,
  ({
    chain,
    railWalletID,
    startingBlock,
  }): Promise<TransactionHistoryItem[]> => {
    return getWalletTransactionHistory(chain, railWalletID, startingBlock);
  },
);

bridgeRegisterCall<GetRailgunAddressParams, Optional<string>>(
  BridgeCallEvent.GetRailgunAddress,
  async ({ railWalletID }): Promise<Optional<string>> => {
    return getRailgunAddress(railWalletID);
  },
);

bridgeRegisterCall<RefreshRailgunBalancesParams, void>(
  BridgeCallEvent.RefreshRailgunBalances,
  async ({ chain, railgunWalletIdFilter }): Promise<void> => {
    return refreshBalances(chain, railgunWalletIdFilter);
  },
);

bridgeRegisterCall<SyncRailgunTransactionsV2Params, void>(
  BridgeCallEvent.SyncRailgunTransactionsV2,
  async ({ networkName }): Promise<void> => {
    return syncRailgunTransactionsV2(networkName);
  },
);

bridgeRegisterCall<RescanFullUTXOMerkletreesAndWalletsParams, void>(
  BridgeCallEvent.RescanFullUTXOMerkletreesAndWallets,
  async ({ chain, railgunWalletIdFilter }): Promise<void> => {
    return rescanFullUTXOMerkletreesAndWallets(chain, railgunWalletIdFilter);
  },
);

bridgeRegisterCall<ResetTXIDMerkletreesV2Params, void>(
  BridgeCallEvent.ResetFullTXIDMerkletreesV2,
  async ({ chain }): Promise<void> => {
    return resetFullTXIDMerkletreesV2(chain);
  },
);

bridgeRegisterCall<GetWalletShareableViewingKeyParams, Optional<string>>(
  BridgeCallEvent.GetWalletShareableViewingKey,
  async ({ railWalletID }): Promise<Optional<string>> => {
    return getWalletShareableViewingKey(railWalletID);
  },
);

bridgeRegisterCall<ValidateRailgunAddressParams, boolean>(
  BridgeCallEvent.ValidateRailgunAddress,
  async ({ address }): Promise<boolean> => {
    return validateRailgunAddress(address);
  },
);

bridgeRegisterCall<ValidateEthAddressParams, boolean>(
  BridgeCallEvent.ValidateEthAddress,
  async ({ address }): Promise<boolean> => {
    return validateEthAddress(address);
  },
);
