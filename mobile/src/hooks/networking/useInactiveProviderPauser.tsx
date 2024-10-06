import { NetworkName } from "@railgun-community/shared-models";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  ProviderLoader,
  ProviderService,
  useReduxSelector,
} from "@react-shared";

export const useInactiveProviderPauser = () => {
  const { network } = useReduxSelector("network");

  const networkNameRef = useRef<NetworkName>(network.current.name);

  const pauseAllPollingProviders = async () => {
    ProviderService.pauseAllPollingProviders();
    await ProviderLoader.pauseAllBridgePollingProviders();
  };

  const resumeProviderForCurrentNetwork = async () => {
    ProviderService.resumeIsolatedPollingProviderForNetwork(
      networkNameRef.current
    );
    await ProviderLoader.resumeIsolatedBridgePollingProviderForNetwork(
      networkNameRef.current
    );
  };

  useEffect(() => {
    networkNameRef.current = network.current.name;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    resumeProviderForCurrentNetwork();
  }, [network]);

  useEffect(() => {
    AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "background") {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        pauseAllPollingProviders();
      } else if (nextAppState === "active") {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        resumeProviderForCurrentNetwork();
      }
    });
  }, []);
};
