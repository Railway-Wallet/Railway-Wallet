import { NetworkName } from '@railgun-community/shared-models';

export const EVENT_CHANGE_PRIVATE_PUBLIC = 'EVENT_CHANGE_PRIVATE_PUBLIC';
export const EVENT_CHANGE_NETWORK = 'EVENT_CHANGE_NETWORK';
export const SWAP_COMPLETE = 'SWAP_COMPLETE';

export type AppEventData =
  | AppEventChangePrivatePublicData
  | AppEventChangeNetworkData;

export type AppEventChangePrivatePublicData = {
  isRailgun: boolean;
};

export type AppEventChangeNetworkData = {
  networkName: NetworkName;
  forceChangeNetwork?: boolean;
};

export const appEventsBus = {
  on(event: string, callback: (event: AppEventData) => void) {
    document.addEventListener(event, (event: any) => callback(event.detail));
  },
  dispatch(event: string, data?: AppEventData) {
    document.dispatchEvent(
      new CustomEvent(event, data ? { detail: data } : {}),
    );
  },
  remove(event: string, callback: (event: AppEventData) => void) {
    document.removeEventListener(event, callback as any);
  },
};
