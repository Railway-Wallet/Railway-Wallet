import {
  isDefined,
  NETWORK_CONFIG,
  NetworkName,
} from "@railgun-community/shared-models";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  AddressResolverStatus,
  ResolvedAddressType,
  UnstoppableDataRecordPath,
} from "../../models/address-resolution";
import { store } from "../../redux-store/store";
import { ProviderService } from "../../services/providers/provider-service";
import { getUnstoppableRecordPathForNetwork } from "../../utils/domain-resolution";
import { endsWithAny } from "../../utils/util";

const ENS_RAILGUN_ADDRESS_KEY = "railgun";

const UNSTOPPABLE_DOMAIN_SUFFIXES: string[] = [
  ".crypto",
  ".nft",
  ".blockchain",
  ".bitcoin",
  ".coin",
  ".wallet",
  ".888",
  ".dao",
  ".x",
  ".zil",
];

type UnstoppableData = {
  records: { [path in UnstoppableDataRecordPath]: Optional<string> };
};

export const useAddressResolver = (
  text: string,
  networkName: NetworkName,
  isRailgun: boolean
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
        NetworkName.Ethereum
      );
      const resolver = await ethereumProvider.getResolver(text);
      if (!isDefined(resolver)) {
        throw new Error(
          `Cannot find ENS resolver for ${NETWORK_CONFIG[networkName].publicName}.`
        );
      }

      let address;
      if (isRailgun) {
        address = await resolver.getText(ENS_RAILGUN_ADDRESS_KEY);
      } else {
        address = await resolver.getAddress();
      }
      if (!isDefined(address) || address === "") {
        throw new Error(
          `Cannot find ENS address for ${NETWORK_CONFIG[networkName].publicName}.`
        );
      }

      setResolvedAddress(address);
      setResolvedAddressType(ResolvedAddressType.ENS);
      setAddressResolverStatus(AddressResolverStatus.Resolved);
    } catch (cause) {
      setAddressResolverStatus(AddressResolverStatus.Error);
      if (!(cause instanceof Error)) {
        throw new Error("Unexpected non-error thrown", { cause });
      }
      setAddressResolverError(
        new Error("Failed to resolve ENS address", { cause })
      );
    }
  }, [isRailgun, networkName, text]);

  const resolveUnstoppableDomainAddress =
    useCallback(async (): Promise<void> => {
      setAddressResolverStatus(AddressResolverStatus.Resolving);
      try {
        const remoteConfig = store.getState().remoteConfig.current;
        if (!isDefined(remoteConfig)) {
          throw new Error("Config not available.");
        }
        const url = `${remoteConfig.proxyApiUrl}/unstoppable/domains/resolve/${text}`;
        const { data }: { data: UnstoppableData } = await axios.get(url);

        const address =
          data.records[
            getUnstoppableRecordPathForNetwork(networkName, isRailgun)
          ];
        if (!isDefined(address)) {
          throw new Error(
            `Cannot find Unstoppable Domain address for ${NETWORK_CONFIG[networkName].publicName}.`
          );
        }

        setResolvedAddress(address);
        setResolvedAddressType(ResolvedAddressType.UnstoppableDomains);
        setAddressResolverStatus(AddressResolverStatus.Resolved);
      } catch (cause) {
        setAddressResolverStatus(AddressResolverStatus.Error);
        if (!(cause instanceof Error)) {
          throw new Error("Unexpected non-error thrown", { cause });
        }
        setAddressResolverError(
          new Error("Failed to resolve Unstoppable Domain address", { cause })
        );
      }
    }, [isRailgun, networkName, text]);

  useEffect(() => {
    const resolveAddress = (): Promise<void> => {
      if (text.endsWith(".eth")) {
        return resolveEnsAddress();
      }
      if (endsWithAny(text, UNSTOPPABLE_DOMAIN_SUFFIXES)) {
        return resolveUnstoppableDomainAddress();
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
  }, [resolveEnsAddress, resolveUnstoppableDomainAddress, text]);

  return {
    addressResolverStatus,
    addressResolverError,
    resolvedAddress,
    resolvedAddressType,
  };
};
