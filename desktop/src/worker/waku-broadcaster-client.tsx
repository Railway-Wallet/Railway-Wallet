import {
  BroadcasterConnectionStatus,
  Chain,
  SelectedBroadcaster,
} from '@railgun-community/shared-models';
import {
  BroadcasterConnectionStatusCallback,
  BroadcasterDebugger,
  BroadcasterOptions,
  BroadcasterTransaction,
  WakuBroadcasterClient,
} from '@railgun-community/waku-broadcaster-client-web';
import {
  BridgeCallEvent,
  BridgeEvent,
  BroadcasterActionData,
  BroadcasterBroadcastTransactionParams,
  BroadcasterFindAllBroadcastersForChainParams,
  BroadcasterFindAllBroadcastersForTokenParams,
  BroadcasterFindBestBroadcasterParams,
  BroadcasterSendActionData,
  BroadcasterSetAddressFiltersParams,
  BroadcasterSetChainParams,
  BroadcasterStartParams,
  BroadcasterStatusCallbackData,
  BroadcasterSupportsERC20TokenParams,
} from '@react-shared';
import { BroadcasterFindRandomBroadcasterForTokenParams } from '../react-shared/src';
import { sendWakuError, sendWakuMessage } from './loggers';
import { bridgeRegisterCall, triggerBridgeEvent } from './worker-ipc-service';

/**
 * Polls for the Waku core to become available, then dials additional direct
 * peers. Designed to run concurrently with WakuBroadcasterClient.start() so
 * that the dialed peers can satisfy waitForPeers if fleet bootstrap fails.
 */
const waitForWakuAndDialPeers = async (
  peerMultiaddrs: string[],
): Promise<void> => {
  if (peerMultiaddrs.length === 0) {
    return;
  }

  const POLL_INTERVAL_MS = 500;
  const MAX_ATTEMPTS = 240; // 2 minutes max polling

  let waku = WakuBroadcasterClient.getWakuCore();
  let attempts = 0;
  while (!waku && attempts < MAX_ATTEMPTS) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    waku = WakuBroadcasterClient.getWakuCore();
    attempts += 1;
  }

  if (!waku) {
    sendWakuError(new Error('Timed out waiting for Waku core to dial direct peers'));
    return;
  }

  for (const ma of peerMultiaddrs) {
    try {
      await waku.dial(ma);
      sendWakuMessage(`Connected to direct peer: ${ma}`);
    } catch (err) {
      sendWakuError(err instanceof Error ? err : new Error(String(err)));
    }
  }
};

const onBroadcasterStatusCallback = (data: BroadcasterStatusCallbackData) => {
  triggerBridgeEvent(BridgeEvent.OnBroadcasterStatusCallback, data);
};

const statusCallback: BroadcasterConnectionStatusCallback = (
  chain: Chain,
  status: BroadcasterConnectionStatus,
) => {
  onBroadcasterStatusCallback({ chain, status });
};

const broadcasterDebugger: BroadcasterDebugger = {
  log: (msg: string) => {
    sendWakuMessage(msg);
  },
  error: (err: Error) => {
    sendWakuError(err);
  },
};

bridgeRegisterCall<BroadcasterStartParams, BroadcasterActionData>(
  BridgeCallEvent.BroadcasterStart,
  async ({
    chain,
    pubSubTopic,
    additionalDirectPeers,
    peerDiscoveryTimeout,
    poiActiveListKeys,
    trustedFeeSigner,
  }) => {
    const broadcasterOptions: BroadcasterOptions = {
      trustedFeeSigner,
      pubSubTopic,
      additionalDirectPeers: [],
      peerDiscoveryTimeout,
      poiActiveListKeys,
    };
    // Start dialing direct peers concurrently. The helper polls for the
    // Waku core (set before waitForPeers blocks), so the dialed peers can
    // satisfy peer requirements even if fleet bootstrap fails.
    const dialPromise = waitForWakuAndDialPeers(additionalDirectPeers ?? []);

    await WakuBroadcasterClient.start(
      chain,
      broadcasterOptions,
      statusCallback,
      broadcasterDebugger,
    );

    // Ensure any remaining dial attempts complete after start succeeds.
    await dialPromise.catch(() => {});

    return {};
  },
);

bridgeRegisterCall<
  Record<string, never>, BroadcasterActionData
>(BridgeCallEvent.BroadcasterTryReconnect, async () => {
  try {
    await WakuBroadcasterClient.tryReconnect();
    return {};
  } catch (err) {
    return { error: err.message };
  }
});

bridgeRegisterCall<BroadcasterSetAddressFiltersParams, void>(
  BridgeCallEvent.BroadcasterSetAddressFilters,
  async ({ allowlist, blocklist }) => {
    return WakuBroadcasterClient.setAddressFilters(allowlist, blocklist);
  },
);

bridgeRegisterCall<BroadcasterSetChainParams, void>(
  BridgeCallEvent.BroadcasterSetChain,
  async ({ chain }) => {
    return WakuBroadcasterClient.setChain(chain);
  },
);

bridgeRegisterCall<
  BroadcasterFindBestBroadcasterParams,
  Optional<SelectedBroadcaster>
>(
  BridgeCallEvent.BroadcasterFindBestBroadcaster,
  async ({ chain, tokenAddress, useRelayAdapt }) => {
    return WakuBroadcasterClient.findBestBroadcaster(
      chain,
      tokenAddress,
      useRelayAdapt,
    );
  },
);
bridgeRegisterCall<
  BroadcasterFindRandomBroadcasterForTokenParams,
  Optional<SelectedBroadcaster>
>(
  BridgeCallEvent.BroadcasterFindRandomBroadcasterForToken,
  async ({ chain, tokenAddress, useRelayAdapt, percentage }) => {
    return WakuBroadcasterClient.findRandomBroadcasterForToken(
      chain,
      tokenAddress,
      useRelayAdapt,
      percentage,
    );
  },
);

bridgeRegisterCall<
  BroadcasterFindAllBroadcastersForTokenParams,
  Optional<SelectedBroadcaster[]>
>(
  BridgeCallEvent.BroadcasterFindAllBroadcastersForToken,
  async ({ chain, tokenAddress, useRelayAdapt }) => {
    return WakuBroadcasterClient.findBroadcastersForToken(
      chain,
      tokenAddress,
      useRelayAdapt,
    );
  },
);

bridgeRegisterCall<
  BroadcasterFindAllBroadcastersForChainParams,
  Optional<SelectedBroadcaster[]>
>(
  BridgeCallEvent.BroadcasterFindAllBroadcastersForChain,
  async ({ chain, useRelayAdapt }) => {
    return WakuBroadcasterClient.findAllBroadcastersForChain(
      chain,
      useRelayAdapt,
    );
  },
);

bridgeRegisterCall<
  Record<string, never>, number
>(BridgeCallEvent.BroadcasterGetMeshPeerCount, async () => {
  return WakuBroadcasterClient.getMeshPeerCount();
});

bridgeRegisterCall<
  Record<string, never>, number
>(BridgeCallEvent.BroadcasterGetPubSubPeerCount, async () => {
  return WakuBroadcasterClient.getPubSubPeerCount();
});

bridgeRegisterCall<
  Record<string, never>, number
>(BridgeCallEvent.BroadcasterGetLightPushPeerCount, async () => {
  const peerCount = await WakuBroadcasterClient.getLightPushPeerCount();
  return peerCount;
});

bridgeRegisterCall<
  Record<string, never>, number
>(BridgeCallEvent.BroadcasterGetFilterPeerCount, async () => {
  const peerCount = await WakuBroadcasterClient.getFilterPeerCount();
  return peerCount;
});

bridgeRegisterCall<
  BroadcasterBroadcastTransactionParams,
  BroadcasterSendActionData
>(
  BridgeCallEvent.BroadcasterBroadcastTransaction,
  async ({
    txidVersionForInputs,
    to,
    data,
    broadcasterRailgunAddress,
    broadcasterFeesID,
    chain,
    nullifiers,
    overallBatchMinGasPrice,
    useRelayAdapt,
    preTransactionPOIsPerTxidLeafPerList,
  }) => {
    const broadcasterTransaction = await BroadcasterTransaction.create(
      txidVersionForInputs,
      to,
      data,
      broadcasterRailgunAddress,
      broadcasterFeesID,
      chain,
      nullifiers,
      overallBatchMinGasPrice,
      useRelayAdapt,
      preTransactionPOIsPerTxidLeafPerList,
    );
    const txHash = await broadcasterTransaction.send();
    return { txHash };
  },
);

bridgeRegisterCall<BroadcasterSupportsERC20TokenParams, boolean>(
  BridgeCallEvent.BroadcasterSupportsERC20Token,
  async ({ chain, tokenAddress, useRelayAdapt }) => {
    return WakuBroadcasterClient.supportsToken(
      chain,
      tokenAddress,
      useRelayAdapt,
    );
  },
);
