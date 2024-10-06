import { useEffect } from "react";
import { setBroadcasterChain } from "../../bridge/bridge-waku-broadcaster-client";
import { useReduxSelector } from "../hooks-redux";

export const useWakuBroadcasterChainUpdater = () => {
  const { network } = useReduxSelector("network");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setBroadcasterChain(network.current.chain);
  }, [network]);
};
