import { DrawerEventData } from '@models/drawer-types';

export const drawerEventsBus = {
  on(event: string, callback: (event: DrawerEventData) => void) {
    document.addEventListener(event, (event: any) => callback(event.detail));
  },
  dispatch(event: string, data?: DrawerEventData) {
    document.dispatchEvent(
      new CustomEvent(event, data ? { detail: data } : {}),
    );
  },
  remove(event: string, callback: (event: DrawerEventData) => void) {
    document.removeEventListener(event, callback as any);
  },
};
