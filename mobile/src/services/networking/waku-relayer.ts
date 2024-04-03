import { Network, networkForChain } from '@railgun-community/shared-models';
import {
  AppDispatch,
  BridgeEvent,
  bridgeListen,
  RelayerStatusCallbackData,
  startWakuRelayerClient,
  updateRelayerConnectionStatus,
} from '@react-shared';

export class WakuRelayer {
  static async start(
    dispatch: AppDispatch,
    network: Network,
    pubSubTopic: string,
    additionalDirectPeers: Optional<string[]>,
    peerDiscoveryTimeout: Optional<number>,
    poiActiveListKeys: string[],
  ) {
    bridgeListen(
      BridgeEvent.OnRelayerStatusCallback,
      ({ chain, status }: RelayerStatusCallbackData) => {
        const network = networkForChain(chain);
        if (!network) {
          return;
        }
        dispatch(
          updateRelayerConnectionStatus({
            networkName: network.name,
            relayerConnectionStatus: status,
          }),
        );
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startWakuRelayerClient(
      network.chain,
      pubSubTopic,
      additionalDirectPeers,
      peerDiscoveryTimeout,
      poiActiveListKeys,
    );
  }
}
