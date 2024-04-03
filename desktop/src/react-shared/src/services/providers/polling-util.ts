import { FallbackProvider, JsonRpcProvider } from 'ethers';
import { PollingJsonRpcProvider } from './polling-json-rpc-provider';

export const createPollingJsonRpcProviderForListeners = async (
  provider: FallbackProvider,
  pollingInterval: number,
): Promise<PollingJsonRpcProvider> => {
  if ('quorum' in provider) {
    if (!provider.providerConfigs.length) {
      throw new Error('Requires 1+ providers in FallbackProvider');
    }
    const firstProvider = provider.providerConfigs[0]
      .provider as JsonRpcProvider;
    if (!('pollingInterval' in firstProvider)) {
      throw new Error(
        'First provider in FallbackProvider must be JsonRpcProvider',
      );
    }

    // eslint-disable-next-line no-underscore-dangle
    const { url } = firstProvider._getConnection();
    const { chainId } = await provider.getNetwork();
    // eslint-disable-next-line no-underscore-dangle
    const maxLogsPerBatch = firstProvider._getOption('batchMaxCount');
    return new PollingJsonRpcProvider(
      url,
      Number(chainId),
      pollingInterval,
      maxLogsPerBatch,
    );
  }

  throw new Error('Invalid ethers provider type');
};
