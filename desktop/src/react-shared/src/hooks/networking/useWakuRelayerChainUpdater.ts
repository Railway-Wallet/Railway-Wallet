import { useEffect } from 'react';
import { setRelayerChain } from '../../bridge/bridge-waku-relayer-client';
import { useReduxSelector } from '../hooks-redux';

export const useWakuRelayerChainUpdater = () => {
  const { network } = useReduxSelector('network');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setRelayerChain(network.current.chain);
  }, [network]);
};
