import { RelayerConnectionStatus } from '@railgun-community/shared-models';
import { useMemo } from 'react';
import { useReduxSelector } from '../hooks-redux';
import { styleguide } from '../../styles/styleguide';

export const useRelayerConnectionStatus = () => {
  const { network } = useReduxSelector('network');
  const { relayerStatus } = useReduxSelector('relayerStatus');

  const networkName = network.current.name;
  const relayerConnectionStatus =
    relayerStatus.forNetwork[networkName]?.connection ??
    RelayerConnectionStatus.Searching;

  const indicatorColor = useMemo(() => {
    switch (relayerConnectionStatus) {
      case RelayerConnectionStatus.Searching:
      case RelayerConnectionStatus.AllUnavailable:
        return styleguide.colors.txYellow();
      case RelayerConnectionStatus.Connected:
        return styleguide.colors.txGreen();
      case RelayerConnectionStatus.Disconnected:
      case RelayerConnectionStatus.Error:
        return styleguide.colors.txRed();
    }
  }, [relayerConnectionStatus]);

  const statusText = useMemo(() => {
    switch (relayerConnectionStatus) {
      case RelayerConnectionStatus.Searching:
        return 'Connecting to public relayers';
      case RelayerConnectionStatus.Connected:
        return 'Connected to public relayers';
      case RelayerConnectionStatus.Error:
        return 'Public relayer connection error';
      case RelayerConnectionStatus.Disconnected:
        return 'Lost public relayer connection';
      case RelayerConnectionStatus.AllUnavailable:
        return 'All public relayers are busy';
    }
  }, [relayerConnectionStatus]);

  return {
    relayerConnectionStatus,
    indicatorColor,
    statusText,
  };
};
