import { createContext } from 'react';

interface LockedDeviceContextType {
  isDeviceLocked: boolean;
  setIsDeviceLocked: (isLocked: boolean) => void;
}

export const LockedDeviceContext = createContext<
  LockedDeviceContextType | undefined
>(undefined);
