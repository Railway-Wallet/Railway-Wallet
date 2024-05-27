import { Network, networkForChain } from '@railgun-community/shared-models';
import {
  AppDispatch,
  BridgeEvent,
  bridgeListen,
  BroadcasterStatusCallbackData,
  showImmediateToast,
  startWakuBroadcasterClient,
  ToastType,
  updateBroadcasterConnectionStatus,
} from '@react-shared';

export class WakuBroadcaster {
  static async start(
    dispatch: AppDispatch,
    network: Network,
    pubSubTopic: string,
    additionalDirectPeers: Optional<string[]>,
    peerDiscoveryTimeout: Optional<number>,
    poiActiveListKeys: string[],
  ) {
    bridgeListen(
      BridgeEvent.OnBroadcasterStatusCallback,
      (data: BroadcasterStatusCallbackData) => {
        const network = networkForChain(data.chain);
        if (!network) {
          return;
        }
        dispatch(
          updateBroadcasterConnectionStatus({
            networkName: network.name,
            broadcasterConnectionStatus: data.status,
          }),
        );
      },
    );

    try {
      await startWakuBroadcasterClient(
        network.chain,
        pubSubTopic,
        additionalDirectPeers,
        peerDiscoveryTimeout,
        poiActiveListKeys,
      );
    } catch (err) {
      dispatch(
        showImmediateToast({
          message: err.message,
          type: ToastType.Error,
        }),
      );
    }
  }
}
