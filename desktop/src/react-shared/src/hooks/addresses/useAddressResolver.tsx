import {
  isDefined,
  NETWORK_CONFIG,
  NetworkName,
} from '@railgun-community/shared-models';
import { useCallback, useEffect, useState } from 'react';
import {
  AddressResolverStatus,
  ResolvedAddressType,
} from '../../models/address-resolution';
import { ProviderService } from '../../services/providers/provider-service';

const ENS_RAILGUN_ADDRESS_KEY = 'railgun';

export const useAddressResolver = (
  text: string,
  networkName: NetworkName,
  isRailgun: boolean,
) => {
  const [addressResolverStatus, setAddressResolverStatus] =
    useState<Optional<AddressResolverStatus>>();
  const [addressResolverError, setAddressResolverError] =
    useState<Optional<Error>>();
  const [resolvedAddress, setResolvedAddress] = useState<Optional<string>>();
  const [resolvedAddressType, setResolvedAddressType] =
    useState<Optional<ResolvedAddressType>>();

  const resolveEnsAddress = useCallback(async (): Promise<void> => {
    try {
      setAddressResolverStatus(AddressResolverStatus.Resolving);

      const ethereumProvider = await ProviderService.getProvider(
        NetworkName.Ethereum,
      );
      const resolver = await ethereumProvider.getResolver(text);
      if (!isDefined(resolver)) {
        throw new Error(
          `Cannot find ENS resolver for ${NETWORK_CONFIG[networkName].publicName}.`,
        );
      }

      let address;
      if (isRailgun) {
        address = await resolver.getText(ENS_RAILGUN_ADDRESS_KEY);
      } else {
        address = await resolver.getAddress();
      }
      if (!isDefined(address) || address === '') {
        throw new Error(
          `Cannot find ENS address for ${NETWORK_CONFIG[networkName].publicName}.`,
        );
      }

      setResolvedAddress(address);
      setResolvedAddressType(ResolvedAddressType.ENS);
      setAddressResolverStatus(AddressResolverStatus.Resolved);
    } catch (cause) {
      setAddressResolverStatus(AddressResolverStatus.Error);
      if (!(cause instanceof Error)) {
        throw new Error('Unexpected non-error thrown', { cause });
      }
      setAddressResolverError(
        new Error('Failed to resolve ENS address', { cause }),
      );
    }
  }, [isRailgun, networkName, text]);

  useEffect(() => {
    const resolveAddress = (): Promise<void> => {
      if (text.endsWith('.eth')) {
        return resolveEnsAddress();
      }

      setResolvedAddress(text);
      setResolvedAddressType(ResolvedAddressType.RawText);
      setAddressResolverStatus(AddressResolverStatus.Resolved);
      return Promise.resolve();
    };

    setResolvedAddress(undefined);
    setAddressResolverError(undefined);
    setAddressResolverStatus(undefined);
    setResolvedAddressType(undefined);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    resolveAddress();
  }, [resolveEnsAddress, text]);

  return {
    addressResolverStatus,
    addressResolverError,
    resolvedAddress,
    resolvedAddressType,
  };
};
