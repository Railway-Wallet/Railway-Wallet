import { useEffect, useState } from "react";
import { getPOIRequiredForNetwork } from "../../bridge/bridge-poi";
import { useReduxSelector } from "../hooks-redux";

export const usePOIRequiredForCurrentNetwork = () => {
  const { network } = useReduxSelector("network");

  const [poiRequired, setPOIRequired] = useState<boolean>(false);

  const currentNetworkName = network.current.name;

  useEffect(() => {
    const checkPOIRequired = async () => {
      if (await getPOIRequiredForNetwork(currentNetworkName)) {
        setPOIRequired(true);
      } else {
        setPOIRequired(false);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    checkPOIRequired();
  }, [currentNetworkName]);

  return { poiRequired };
};
