import {
  Chain,
  RelayerConnectionStatus,
  SelectedRelayer,
} from '@railgun-community/shared-models';
import {
  RelayerConnectionStatusCallback,
  RelayerDebugger,
  RelayerOptions,
  RelayerTransaction,
  WakuRelayerClient,
} from '@railgun-community/waku-relayer-client-node';
import { sendWakuError, sendWakuMessage } from '../bridge/loggers';
import {
  BridgeCallEvent,
  BridgeEvent,
  RelayerActionData,
  RelayerFindAllRelayersForChainParams,
  RelayerFindAllRelayersForTokenParams,
  RelayerFindBestRelayerParams,
  RelayerFindRandomRelayerForTokenParams,
  RelayerRelayTransactionParams,
  RelayerSendActionData,
  RelayerSetAddressFiltersParams,
  RelayerSetChainParams,
  RelayerStartParams,
  RelayerStatusCallbackData,
  RelayerSupportsERC20TokenParams,
} from '../bridge/model';
import {
  bridgeRegisterCall,
  triggerBridgeEvent,
} from '../bridge/node-ipc-service';

const onRelayerStatusCallback = (data: RelayerStatusCallbackData) => {
  triggerBridgeEvent(BridgeEvent.OnRelayerStatusCallback, data);
};

const statusCallback: RelayerConnectionStatusCallback = (
  chain: Chain,
  status: RelayerConnectionStatus,
) => {
  onRelayerStatusCallback({ chain, status });
};

const relayerDebugger: RelayerDebugger = {
  log: (msg: string) => {
    sendWakuMessage(msg);
  },
  error: (err: Error) => {
    sendWakuMessage('Error:');
    sendWakuError(err);
  },
};

bridgeRegisterCall<RelayerStartParams, RelayerActionData>(
  BridgeCallEvent.RelayerStart,
  async ({
    chain,
    pubSubTopic,
    additionalDirectPeers,
    peerDiscoveryTimeout,
    poiActiveListKeys,
  }) => {
    try {
      const relayerOptions: RelayerOptions = {
        pubSubTopic,
        additionalDirectPeers,
        peerDiscoveryTimeout,
        poiActiveListKeys,
      };
      await WakuRelayerClient.start(
        chain,
        relayerOptions,
        statusCallback,
        relayerDebugger,
      );
      return {};
    } catch (err) {
      return { error: err.message };
    }
  },
);

bridgeRegisterCall<
  Record<string, never>, RelayerActionData
>(BridgeCallEvent.RelayerTryReconnect, async () => {
  try {
    await WakuRelayerClient.tryReconnect();
    return {};
  } catch (err) {
    return { error: err.message };
  }
});

bridgeRegisterCall<RelayerSetAddressFiltersParams, void>(
  BridgeCallEvent.RelayerSetAddressFilters,
  async ({ allowlist, blocklist }) => {
    return WakuRelayerClient.setAddressFilters(allowlist, blocklist);
  },
);

bridgeRegisterCall<RelayerSetChainParams, void>(
  BridgeCallEvent.RelayerSetChain,
  async ({ chain }) => {
    return WakuRelayerClient.setChain(chain);
  },
);

bridgeRegisterCall<RelayerFindBestRelayerParams, Optional<SelectedRelayer>>(
  BridgeCallEvent.RelayerFindBestRelayer,
  async ({ chain, tokenAddress, useRelayAdapt }) => {
    return WakuRelayerClient.findBestRelayer(
      chain,
      tokenAddress,
      useRelayAdapt,
    );
  },
);

bridgeRegisterCall<
  RelayerFindRandomRelayerForTokenParams,
  Optional<SelectedRelayer>
>(
  BridgeCallEvent.RelayerFindRandomRelayerForToken,
  async ({ chain, tokenAddress, useRelayAdapt, percentage }) => {
    return WakuRelayerClient.findRandomRelayerForToken(
      chain,
      tokenAddress,
      useRelayAdapt,
      percentage,
    );
  },
);

bridgeRegisterCall<
  RelayerFindAllRelayersForTokenParams,
  Optional<SelectedRelayer[]>
>(
  BridgeCallEvent.RelayerFindAllRelayersForToken,
  async ({ chain, tokenAddress, useRelayAdapt }) => {
    return WakuRelayerClient.findRelayersForToken(
      chain,
      tokenAddress,
      useRelayAdapt,
    );
  },
);

bridgeRegisterCall<
  RelayerFindAllRelayersForChainParams,
  Optional<SelectedRelayer[]>
>(
  BridgeCallEvent.RelayerFindAllRelayersForChain,
  async ({ chain, useRelayAdapt }) => {
    return WakuRelayerClient.findAllRelayersForChain(chain, useRelayAdapt);
  },
);

bridgeRegisterCall<
  Record<string, never>, number
>(BridgeCallEvent.RelayerGetMeshPeerCount, async () => {
  return WakuRelayerClient.getMeshPeerCount();
});

bridgeRegisterCall<
  Record<string, never>, number
>(BridgeCallEvent.RelayerGetPubSubPeerCount, async () => {
  return WakuRelayerClient.getPubSubPeerCount();
});

bridgeRegisterCall<
  Record<string, never>, number
>(BridgeCallEvent.RelayerGetLightPushPeerCount, async () => {
  const peerCount = await WakuRelayerClient.getLightPushPeerCount();
  return peerCount;
});

bridgeRegisterCall<
  Record<string, never>, number
>(BridgeCallEvent.RelayerGetFilterPeerCount, async () => {
  const peerCount = await WakuRelayerClient.getFilterPeerCount();
  return peerCount;
});

bridgeRegisterCall<RelayerRelayTransactionParams, RelayerSendActionData>(
  BridgeCallEvent.RelayerRelayTransaction,
  async ({
    txidVersionForInputs,
    to,
    data,
    relayerRailgunAddress,
    relayerFeesID,
    chain,
    nullifiers,
    overallBatchMinGasPrice,
    useRelayAdapt,
    preTransactionPOIsPerTxidLeafPerList,
  }) => {
    try {
      const relayerTransaction = await RelayerTransaction.create(
        txidVersionForInputs,
        to,
        data,
        relayerRailgunAddress,
        relayerFeesID,
        chain,
        nullifiers,
        overallBatchMinGasPrice,
        useRelayAdapt,
        preTransactionPOIsPerTxidLeafPerList,
      );
      const txHash = await relayerTransaction.send();
      return { txHash };
    } catch (err) {
      return { error: err.message };
    }
  },
);

bridgeRegisterCall<RelayerSupportsERC20TokenParams, boolean>(
  BridgeCallEvent.RelayerSupportsERC20Token,
  async ({ chain, tokenAddress, useRelayAdapt }) => {
    return WakuRelayerClient.supportsToken(chain, tokenAddress, useRelayAdapt);
  },
);
