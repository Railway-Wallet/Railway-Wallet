import {
  Chain,
  isDefined,
  PreTransactionPOIsPerTxidLeafPerList,
  SelectedBroadcaster,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { BridgeCallEvent } from "../models";
import {
  BroadcasterActionData,
  BroadcasterBroadcastTransactionParams,
  BroadcasterFindAllBroadcastersForChainParams,
  BroadcasterFindAllBroadcastersForTokenParams,
  BroadcasterFindBestBroadcasterParams,
  BroadcasterFindRandomBroadcasterForTokenParams,
  BroadcasterSendActionData,
  BroadcasterSetAddressFiltersParams,
  BroadcasterSetChainParams,
  BroadcasterStartParams,
  BroadcasterSupportsERC20TokenParams,
} from "../models/bridge";
import { bridgeCall } from "./ipc";

export const startWakuBroadcasterClient = async (
  chain: Chain,
  pubSubTopic: string,
  additionalDirectPeers: Optional<string[]>,
  peerDiscoveryTimeout: Optional<number>,
  poiActiveListKeys: string[]
): Promise<void> => {
  await bridgeCall<BroadcasterStartParams, BroadcasterActionData>(
    BridgeCallEvent.BroadcasterStart,
    {
      chain,
      pubSubTopic,
      additionalDirectPeers,
      peerDiscoveryTimeout,
      poiActiveListKeys,
    }
  );
};

export const tryReconnectWakuBroadcasterClient = async (): Promise<void> => {
  await bridgeCall<Record<string, never>, BroadcasterActionData>(
    BridgeCallEvent.BroadcasterTryReconnect,
    {}
  );
};

export const setBroadcasterAddressFilters = async (
  allowlist: Optional<string[]>,
  blocklist: Optional<string[]>
): Promise<void> => {
  await bridgeCall<BroadcasterSetAddressFiltersParams, void>(
    BridgeCallEvent.BroadcasterSetAddressFilters,
    { allowlist, blocklist }
  );
};

export const setBroadcasterChain = async (chain: Chain): Promise<void> => {
  await bridgeCall<BroadcasterSetChainParams, void>(
    BridgeCallEvent.BroadcasterSetChain,
    { chain }
  );
};

export const findBestBroadcaster = async (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean
): Promise<Optional<SelectedBroadcaster>> => {
  const selectedBroadcaster = await bridgeCall<
    BroadcasterFindBestBroadcasterParams,
    Optional<SelectedBroadcaster>
  >(BridgeCallEvent.BroadcasterFindBestBroadcaster, {
    chain,
    tokenAddress,
    useRelayAdapt,
  });
  return selectedBroadcaster;
};

export const findRandomBroadcaster = async (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean
): Promise<Optional<SelectedBroadcaster>> => {
  const selectedBroadcaster = await bridgeCall<
    BroadcasterFindRandomBroadcasterForTokenParams,
    Optional<SelectedBroadcaster>
  >(BridgeCallEvent.BroadcasterFindRandomBroadcasterForToken, {
    chain,
    tokenAddress,
    useRelayAdapt,
    percentage: 10,
  });
  return selectedBroadcaster;
};

export const findAllBroadcastersForToken = async (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean
): Promise<Optional<SelectedBroadcaster[]>> => {
  const selectedBroadcasters = await bridgeCall<
    BroadcasterFindAllBroadcastersForTokenParams,
    Optional<SelectedBroadcaster[]>
  >(BridgeCallEvent.BroadcasterFindAllBroadcastersForToken, {
    chain,
    tokenAddress,
    useRelayAdapt,
  });
  return selectedBroadcasters;
};

export const findAllBroadcastersForChain = async (
  chain: Chain,
  useRelayAdapt: boolean
): Promise<Optional<SelectedBroadcaster[]>> => {
  const selectedBroadcasters = await bridgeCall<
    BroadcasterFindAllBroadcastersForChainParams,
    Optional<SelectedBroadcaster[]>
  >(BridgeCallEvent.BroadcasterFindAllBroadcastersForChain, {
    chain,
    useRelayAdapt,
  });
  return selectedBroadcasters;
};

export const getBroadcasterMeshPeerCount = async (): Promise<number> => {
  const meshPeerCount = await bridgeCall<Record<string, never>, number>(
    BridgeCallEvent.BroadcasterGetMeshPeerCount,
    {}
  );
  return meshPeerCount;
};

export const getBroadcasterPubSubPeerCount = async (): Promise<number> => {
  const peerCount = await bridgeCall<Record<string, never>, number>(
    BridgeCallEvent.BroadcasterGetPubSubPeerCount,
    {}
  );
  return peerCount;
};

export const getBroadcasterFilterPeerCount = async (): Promise<number> => {
  const peerCount = await bridgeCall<Record<string, never>, number>(
    BridgeCallEvent.BroadcasterGetFilterPeerCount,
    {}
  );
  return peerCount;
};

export const getBroadcasterLightPushPeerCount = async (): Promise<number> => {
  const peerCount = await bridgeCall<Record<string, never>, number>(
    BridgeCallEvent.BroadcasterGetLightPushPeerCount,
    {}
  );
  return peerCount;
};

export const broadcastTransaction = async (
  txidVersionForInputs: TXIDVersion,
  to: string,
  data: string,
  broadcasterRailgunAddress: string,
  broadcasterFeesID: string,
  chain: Chain,
  nullifiers: string[],
  overallBatchMinGasPrice: bigint,
  useRelayAdapt: boolean,
  preTransactionPOIsPerTxidLeafPerList: PreTransactionPOIsPerTxidLeafPerList
): Promise<string> => {
  const response = await bridgeCall<
    BroadcasterBroadcastTransactionParams,
    BroadcasterSendActionData
  >(BridgeCallEvent.BroadcasterBroadcastTransaction, {
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
  });
  if (isDefined(response.error)) {
    throw response.error;
  }
  if (!isDefined(response.txHash)) {
    throw new Error("No transaction ID captured from successful broadcast.");
  }
  return response.txHash;
};

export const broadcasterSupportsERC20Token = async (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean
): Promise<boolean> => {
  const supportsToken = await bridgeCall<
    BroadcasterSupportsERC20TokenParams,
    boolean
  >(BridgeCallEvent.BroadcasterSupportsERC20Token, {
    chain,
    tokenAddress,
    useRelayAdapt,
  });
  return supportsToken;
};
