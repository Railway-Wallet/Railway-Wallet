import { MorphoVaultAPI } from '@railgun-community/cookbook';
import { isDefined, NetworkName } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { isAddress } from 'ethers';
import { ProviderService } from '../../services/providers/provider-service';
import { logDevError } from '../../utils/logging';
import { useReduxSelector } from '../hooks-redux';

const MORPHO_NETWORK = NetworkName.Ethereum;

export type MorphoVaultInfo = {
  vaultAddress: string;
  assetAddress: string;
  assetDecimals: number;
  shareDecimals: number;
};

export const useMorphoVaultData = (vaultAddress: Optional<string>) => {
  const { network } = useReduxSelector('network');
  const networkName = network.current.name;
  const isSupported = networkName === MORPHO_NETWORK;

  const [vaultInfo, setVaultInfo] = useState<Optional<MorphoVaultInfo>>();
  const [error, setError] = useState<Optional<Error>>();
  const [isLoading, setIsLoading] = useState(false);

  const validAddress =
    isDefined(vaultAddress) && isAddress(vaultAddress)
      ? vaultAddress
      : undefined;

  useEffect(() => {
    if (!isDefined(validAddress) || !isSupported) {
      setVaultInfo(undefined);
      setError(undefined);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(undefined);
    const read = async () => {
      try {
        const provider = await ProviderService.getProvider(networkName);
        const data = await MorphoVaultAPI.getVaultData(validAddress, provider);
        if (!cancelled) {
          setVaultInfo({
            vaultAddress: validAddress,
            assetAddress: data.assetAddress,
            assetDecimals: Number(data.assetDecimals),
            shareDecimals: Number(data.shareDecimals),
          });
        }
      } catch (err) {
        if (!cancelled) {
          logDevError(
            new Error('Failed to read Morpho vault data', { cause: err }),
          );
          setVaultInfo(undefined);
          setError(
            new Error(
              'Could not read this Morpho vault. Check the address is a MetaMorpho vault on Ethereum.',
              { cause: err },
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    read();
    return () => {
      cancelled = true;
    };
  }, [validAddress, networkName, isSupported]);

  return { vaultInfo, isLoading, error, isSupported };
};
