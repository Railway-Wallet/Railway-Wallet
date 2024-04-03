import { bridgeRegisterCall } from '../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  GetChainTxidsStillPendingSpentPOIsParams,
  GetPOIRequiredForNetworkParams,
  GetSpendableReceivedChainTxidsParams,
} from '../../bridge/model';
import {
  POIRequired,
  getChainTxidsStillPendingSpentPOIs,
  getSpendableReceivedChainTxids,
} from '@railgun-community/wallet';

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
