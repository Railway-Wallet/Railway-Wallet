import {
  Chain,
  isDefined,
  PreTransactionPOIsPerTxidLeafPerList,
  SelectedRelayer,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { BridgeCallEvent } from '../models';
import {
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
  RelayerSupportsERC20TokenParams,
} from '../models/bridge';
import { bridgeCall } from './ipc';

export const startWakuRelayerClient = async (
  chain: Chain,
  pubSubTopic: string,
  additionalDirectPeers: Optional<string[]>,
  peerDiscoveryTimeout: Optional<number>,
  poiActiveListKeys: string[],
): Promise<void> => {
  await bridgeCall<RelayerStartParams, RelayerActionData>(
    BridgeCallEvent.RelayerStart,
    {
      chain,
      pubSubTopic,
      additionalDirectPeers,
      peerDiscoveryTimeout,
      poiActiveListKeys,
    },
  );
};

export const tryReconnectWakuRelayerClient = async (): Promise<void> => {
  await bridgeCall<
    Record<string, never>, RelayerActionData
  >(BridgeCallEvent.RelayerTryReconnect, {});
};

export const setRelayerAddressFilters = async (
  allowlist: Optional<string[]>,
  blocklist: Optional<string[]>,
): Promise<void> => {
  await bridgeCall<RelayerSetAddressFiltersParams, void>(
    BridgeCallEvent.RelayerSetAddressFilters,
    { allowlist, blocklist },
  );
};

export const setRelayerChain = async (chain: Chain): Promise<void> => {
  await bridgeCall<RelayerSetChainParams, void>(
    BridgeCallEvent.RelayerSetChain,
    { chain },
  );
};

export const findBestRelayer = async (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean,
): Promise<Optional<SelectedRelayer>> => {
  const selectedRelayer = await bridgeCall<
    RelayerFindBestRelayerParams,
    Optional<SelectedRelayer>
  >(BridgeCallEvent.RelayerFindBestRelayer, {
    chain,
    tokenAddress,
    useRelayAdapt,
  });
  return selectedRelayer;
};

export const findRandomRelayer = async (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean,
): Promise<Optional<SelectedRelayer>> => {
  const selectedRelayer = await bridgeCall<
    RelayerFindRandomRelayerForTokenParams,
    Optional<SelectedRelayer>
  >(BridgeCallEvent.RelayerFindRandomRelayerForToken, {
    chain,
    tokenAddress,
    useRelayAdapt,
    percentage: 10,
  });
  return selectedRelayer;
};

export const findAllRelayersForToken = async (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean,
): Promise<Optional<SelectedRelayer[]>> => {
  const selectedRelayers = await bridgeCall<
    RelayerFindAllRelayersForTokenParams,
    Optional<SelectedRelayer[]>
  >(BridgeCallEvent.RelayerFindAllRelayersForToken, {
    chain,
    tokenAddress,
    useRelayAdapt,
  });
  return selectedRelayers;
};

export const findAllRelayersForChain = async (
  chain: Chain,
  useRelayAdapt: boolean,
): Promise<Optional<SelectedRelayer[]>> => {
  const selectedRelayers = await bridgeCall<
    RelayerFindAllRelayersForChainParams,
    Optional<SelectedRelayer[]>
  >(BridgeCallEvent.RelayerFindAllRelayersForChain, {
    chain,
    useRelayAdapt,
  });
  return selectedRelayers;
};

export const getRelayerMeshPeerCount = async (): Promise<number> => {
  const meshPeerCount = await bridgeCall<
    Record<string, never>, number
  >(BridgeCallEvent.RelayerGetMeshPeerCount, {});
  return meshPeerCount;
};

export const getRelayerPubSubPeerCount = async (): Promise<number> => {
  const peerCount = await bridgeCall<
    Record<string, never>, number
  >(BridgeCallEvent.RelayerGetPubSubPeerCount, {});
  return peerCount;
};

export const getRelayerFilterPeerCount = async (): Promise<number> => {
  const peerCount = await bridgeCall<
    Record<string, never>, number
  >(BridgeCallEvent.RelayerGetFilterPeerCount, {});
  return peerCount;
};

export const getRelayerLightPushPeerCount = async (): Promise<number> => {
  const peerCount = await bridgeCall<
    Record<string, never>, number
  >(BridgeCallEvent.RelayerGetLightPushPeerCount, {});
  return peerCount;
};

export const relayTransaction = async (
  txidVersionForInputs: TXIDVersion,
  to: string,
  data: string,
  relayerRailgunAddress: string,
  relayerFeesID: string,
  chain: Chain,
  nullifiers: string[],
  overallBatchMinGasPrice: bigint,
  useRelayAdapt: boolean,
  preTransactionPOIsPerTxidLeafPerList: PreTransactionPOIsPerTxidLeafPerList,
): Promise<string> => {
  const response = await bridgeCall<
    RelayerRelayTransactionParams,
    RelayerSendActionData
  >(BridgeCallEvent.RelayerRelayTransaction, {
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
  });
  if (isDefined(response.error)) {
    throw response.error;
  }
  if (!isDefined(response.txHash)) {
    throw new Error('No transaction ID captured from successful relay.');
  }
  return response.txHash;
};

export const relayerSupportsERC20Token = async (
  chain: Chain,
  tokenAddress: string,
  useRelayAdapt: boolean,
): Promise<boolean> => {
  const supportsToken = await bridgeCall<
    RelayerSupportsERC20TokenParams,
    boolean
  >(BridgeCallEvent.RelayerSupportsERC20Token, {
    chain,
    tokenAddress,
    useRelayAdapt,
  });
  return supportsToken;
};
