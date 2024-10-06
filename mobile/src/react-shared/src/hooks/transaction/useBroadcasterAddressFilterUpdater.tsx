import { useEffect, useMemo } from "react";
import { UpdateBroadcasterAddressFilters } from "../../models/callbacks";
import { useReduxSelector } from "../hooks-redux";

export const useBroadcasterAddressFilterUpdater = (
  updateBroadcasterAddressFilters: UpdateBroadcasterAddressFilters
) => {
  const { broadcasterSkiplist } = useReduxSelector("broadcasterSkiplist");
  const { broadcasterBlocklist } = useReduxSelector("broadcasterBlocklist");
  const { remoteConfig } = useReduxSelector("remoteConfig");

  const blocklist = useMemo(() => {
    const deviceRailgunAddressBlocklist = broadcasterBlocklist.broadcasters.map(
      (broadcaster) => broadcaster.railgunAddress
    );
    const remoteRailgunAddressBlocklist: string[] =
      remoteConfig.current?.["bootstrapPeers-"] ?? [];

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

  useEffect(() => {
    const allowlist: Optional<string[]> = undefined;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateBroadcasterAddressFilters(allowlist, blocklist);
  }, [blocklist, updateBroadcasterAddressFilters]);

  return { blocklist };
};
