import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useMemo } from 'react';
import { UpdateBroadcasterAddressFilters } from '../../models/callbacks';
import { useReduxSelector } from '../hooks-redux';

export const useBroadcasterAddressFilterUpdater = (
  updateBroadcasterAddressFilters: UpdateBroadcasterAddressFilters,
) => {
  const { broadcasterSkiplist } = useReduxSelector('broadcasterSkiplist');
  const { broadcasterBlocklist } = useReduxSelector('broadcasterBlocklist');
  const { remoteConfig } = useReduxSelector('remoteConfig');

  const blocklist = useMemo(() => {
    const deviceRailgunAddressBlocklist = broadcasterBlocklist.broadcasters.map(
      broadcaster => broadcaster.railgunAddress,
    );
    const remoteRailgunAddressBlocklist: string[] =
      remoteConfig.current?.['bootstrapPeers-'] ?? [];

    return [
      ...deviceRailgunAddressBlocklist,
      ...remoteRailgunAddressBlocklist,
      ...broadcasterSkiplist.railgunAddresses,
    ];
  }, [
    broadcasterSkiplist.railgunAddresses,
    remoteConfig,
    broadcasterBlocklist.broadcasters,
  ]);

  const allowlist = useMemo<Optional<string[]>>(() => {
    const trustedFeeSigner = remoteConfig.current?.trustedFeeSigner;
    if (!isDefined(trustedFeeSigner)) {
      return undefined;
    }
    const trustedFeeSigners = (
      Array.isArray(trustedFeeSigner) ? trustedFeeSigner : [trustedFeeSigner]
    ).filter(railgunAddress => railgunAddress.length > 0);
    return trustedFeeSigners.length > 0 ? trustedFeeSigners : undefined;
  }, [remoteConfig]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateBroadcasterAddressFilters(allowlist, blocklist);
  }, [allowlist, blocklist, updateBroadcasterAddressFilters]);

  return { allowlist, blocklist };
};
