import { ZeroXQuote } from "@railgun-community/cookbook";
import { useMemo } from "react";
import { useReduxSelector } from "../hooks-redux";

export const useShouldEnableSwaps = (
  unavailableOnPlatform: boolean = false
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { remoteConfig } = useReduxSelector("remoteConfig");

  const shouldEnableSwaps = useMemo(() => {
    if (unavailableOnPlatform) {
      return false;
    }

    if (wallets.active?.isViewOnlyWallet ?? false) {
      return false;
    }

    const networkName = network.current.name;

    if (!ZeroXQuote.supportsNetwork(networkName)) {
      return false;
    }

    const availableNetwork =
      remoteConfig.current?.availableNetworks[networkName];
    if (availableNetwork) {
      if (
        !availableNetwork.canSendPublic &&
        !availableNetwork.canSendShielded
      ) {
        return false;
      }
    }

    return true;
  }, [
    network,
    remoteConfig,
    unavailableOnPlatform,
    wallets.active?.isViewOnlyWallet,
  ]);

  return { shouldEnableSwaps };
};
