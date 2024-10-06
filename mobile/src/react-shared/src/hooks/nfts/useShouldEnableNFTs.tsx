import { useMemo } from "react";
import { networkSupportsAlchemy } from "../../services";
import { useReduxSelector } from "../hooks-redux";

export const useShouldEnableNFTs = () => {
  const { network } = useReduxSelector("network");

  const shouldEnableNFTs = useMemo(() => {
    const networkName = network.current.name;

    if (!networkSupportsAlchemy(networkName)) {
      return false;
    }

    return true;
  }, [network]);

  return { shouldEnableNFTs };
};
