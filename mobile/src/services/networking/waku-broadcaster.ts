import { Network, networkForChain } from "@railgun-community/shared-models";
import {
  AppDispatch,
  BridgeEvent,
  bridgeListen,
  BroadcasterStatusCallbackData,
  startWakuBroadcasterClient,
  updateBroadcasterConnectionStatus,
} from "@react-shared";

export class WakuBroadcaster {
  static async start(
    dispatch: AppDispatch,
    network: Network,
    pubSubTopic: string,
    additionalDirectPeers: Optional<string[]>,
    peerDiscoveryTimeout: Optional<number>,
    poiActiveListKeys: string[]
  ) {
    bridgeListen(
      BridgeEvent.OnBroadcasterStatusCallback,
      ({ chain, status }: BroadcasterStatusCallbackData) => {
        const network = networkForChain(chain);
        if (!network) {
          return;
        }
        dispatch(
          updateBroadcasterConnectionStatus({
            networkName: network.name,
            broadcasterConnectionStatus: status,
          })
        );
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startWakuBroadcasterClient(
      network.chain,
      pubSubTopic,
      additionalDirectPeers,
      peerDiscoveryTimeout,
      poiActiveListKeys
    );
  }
}
