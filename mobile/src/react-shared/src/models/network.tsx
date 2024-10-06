import { NetworkName } from "@railgun-community/shared-models";

export type NetworkSettings = {
  canSendPublic: boolean;
  canSendShielded: boolean;
  canShield: boolean;
  canUnshield: boolean;
  canSwapPublic: boolean;
  canSwapShielded: boolean;
  canRelayAdapt: boolean;
  isDevOnly?: boolean;
  quickSyncURL?: string;
};

export enum NetworkFeeSelection {
  Slower = "Slower",
  Standard = "Standard",
  Faster = "Faster",
  Aggressive = "Aggressive",
  Custom = "Custom",
}

export type SettingsForNetwork = {
  rpcCustomURLs: string[];
  useDefaultRailwayRPCsAsBackup: boolean;
};

export type NetworkStoredSettings = {
  forNetwork: { [networkName in NetworkName]?: SettingsForNetwork };
};
