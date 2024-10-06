import { BroadcasterConnectionStatus } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { useReduxSelector } from "../hooks-redux";
import { styleguide } from "../../styles/styleguide";

export const useBroadcasterConnectionStatus = () => {
  const { network } = useReduxSelector("network");
  const { broadcasterStatus } = useReduxSelector("broadcasterStatus");

  const networkName = network.current.name;
  const broadcasterConnectionStatus =
    broadcasterStatus.forNetwork[networkName]?.connection ??
    BroadcasterConnectionStatus.Searching;

  const indicatorColor = useMemo(() => {
    switch (broadcasterConnectionStatus) {
      case BroadcasterConnectionStatus.Searching:
      case BroadcasterConnectionStatus.AllUnavailable:
        return styleguide.colors.txYellow();
      case BroadcasterConnectionStatus.Connected:
        return styleguide.colors.txGreen();
      case BroadcasterConnectionStatus.Disconnected:
      case BroadcasterConnectionStatus.Error:
        return styleguide.colors.txRed();
    }
  }, [broadcasterConnectionStatus]);

  const statusText = useMemo(() => {
    switch (broadcasterConnectionStatus) {
      case BroadcasterConnectionStatus.Searching:
        return "Connecting to public broadcasters";
      case BroadcasterConnectionStatus.Connected:
        return "Connected to public broadcasters";
      case BroadcasterConnectionStatus.Error:
        return "Public broadcaster connection error";
      case BroadcasterConnectionStatus.Disconnected:
        return "Lost public broadcaster connection";
      case BroadcasterConnectionStatus.AllUnavailable:
        return "All public broadcasters are busy";
    }
  }, [broadcasterConnectionStatus]);

  return {
    broadcasterConnectionStatus,
    indicatorColor,
    statusText,
  };
};
