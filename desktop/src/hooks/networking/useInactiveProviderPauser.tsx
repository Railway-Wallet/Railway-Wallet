import { NetworkName } from '@railgun-community/shared-models';
import { useEffect, useRef } from 'react';
import {
  ProviderLoader,
  ProviderService,
  useReduxSelector,
} from '@react-shared';

export const useInactiveProviderPauser = () => {
  const { network } = useReduxSelector('network');

  const networkNameRef = useRef<NetworkName>(network.current.name);

  const pauseAllPollingProviders = async () => {
    ProviderService.pauseAllPollingProviders();
    await ProviderLoader.pauseAllBridgePollingProviders();
  };

  const resumeProviderForCurrentNetwork = async () => {
    ProviderService.resumeIsolatedPollingProviderForNetwork(
      networkNameRef.current,
    );
    await ProviderLoader.resumeIsolatedBridgePollingProviderForNetwork(
      networkNameRef.current,
    );
  };

  useEffect(() => {
    networkNameRef.current = network.current.name;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    resumeProviderForCurrentNetwork();
  }, [network]);

  useEffect(() => {
    document.addEventListener('visibilitychange', async visibility => {
      if (document.visibilityState === 'visible') {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        resumeProviderForCurrentNetwork();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        pauseAllPollingProviders();
      }
    });
  }, []);
};
