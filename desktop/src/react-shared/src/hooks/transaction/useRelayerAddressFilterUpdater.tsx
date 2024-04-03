import { useEffect, useMemo } from 'react';
import { UpdateRelayerAddressFilters } from '../../models/callbacks';
import { useReduxSelector } from '../hooks-redux';

export const useRelayerAddressFilterUpdater = (
  updateRelayerAddressFilters: UpdateRelayerAddressFilters,
) => {
  const { relayerSkiplist } = useReduxSelector('relayerSkiplist');
  const { relayerBlocklist } = useReduxSelector('relayerBlocklist');
  const { remoteConfig } = useReduxSelector('remoteConfig');

  const blocklist = useMemo(() => {
    const deviceRailgunAddressBlocklist = relayerBlocklist.relayers.map(
      relayer => relayer.railgunAddress,
    );
    const remoteRailgunAddressBlocklist: string[] =
      remoteConfig.current?.['bootstrapPeers-'] ?? [];

    return [
      ...deviceRailgunAddressBlocklist,
      ...remoteRailgunAddressBlocklist,
      ...relayerSkiplist.railgunAddresses,
    ];
  }, [
    relayerSkiplist.railgunAddresses,
    remoteConfig,
    relayerBlocklist.relayers,
  ]);

  useEffect(() => {
    const allowlist: Optional<string[]> = undefined;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateRelayerAddressFilters(allowlist, blocklist);
  }, [blocklist, updateRelayerAddressFilters]);

  return { blocklist };
};
