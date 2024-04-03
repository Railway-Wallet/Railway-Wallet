import { Network, networkForChain } from '@railgun-community/shared-models';
import {
  AppDispatch,
  BridgeEvent,
  bridgeListen,
  RelayerStatusCallbackData,
  showImmediateToast,
  startWakuRelayerClient,
  ToastType,
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
      (data: RelayerStatusCallbackData) => {
        const network = networkForChain(data.chain);
        if (!network) {
          return;
        }
        dispatch(
          updateRelayerConnectionStatus({
            networkName: network.name,
            relayerConnectionStatus: data.status,
          }),
        );
      },
    );

    try {
      await startWakuRelayerClient(
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
