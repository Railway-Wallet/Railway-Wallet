import {
  FallbackProviderJsonConfig,
  NetworkName,
} from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NetworkSettings } from "../../models/network";
import { POIDocumentation } from "../../models/poi";
import { TempNotification } from "./temp-notification-reducer";

export type RemoteConfig = {
  minVersionNumberIOS: string;
  minVersionNumberAndroid: string;
  minVersionNumberWeb: string;
  "bootstrapPeers-": string[];
  wakuPubSubTopic: string;
  additionalDirectPeers: Optional<string[]>;
  wakuPeerDiscoveryTimeout: number;
  defaultNetworkName: string;
  tempNotification?: TempNotification;
  availableNetworks: Partial<Record<NetworkName, NetworkSettings>>;
  networkProvidersConfig: Partial<
    Record<NetworkName, FallbackProviderJsonConfig>
  >;
  networkProvidersConfigArchiveNodes: Partial<
    Record<NetworkName, FallbackProviderJsonConfig>
  >;
  maintenanceMessage?: string;
  legacyAppDeprecated?: boolean;
  pollingInterval: number;
  proxyApiUrl: string;
  proxyNftsApiUrl: string;
  proxyPoiAggregatorUrl: string;
  publicPoiAggregatorUrls: string[];
  poiDocumentation?: POIDocumentation;
};

export type RemoteConfigState = {
  current?: RemoteConfig;
};

const initialState = {
  current: undefined,
} as RemoteConfigState;

const slice = createSlice({
  name: "remoteConfig",
  initialState,
  reducers: {
    setRemoteConfig(state, action: PayloadAction<RemoteConfig>) {
      state.current = action.payload;
    },
  },
});

export const { setRemoteConfig } = slice.actions;
export const remoteConfigReducer = slice.reducer;
