/* eslint-disable no-restricted-globals */
import { sendErrorMessage } from '@railgun-community/wallet';
import { BridgeEvent } from '@react-shared';
import { NodejsMobileIPC as IPC } from 'nodejs-mobile-ipc2';

const listeners = new Map<string, CallableFunction>();

self.onmessage = ({
  data,
}: MessageEvent<{ event: string; result: unknown }>) => {
  const listener = listeners.get(data.event);
  listener?.(data.result);
};

const ipcWorkerWrapper = {
  post<ParamsType>(event: string, result: ParamsType) {
    self.postMessage({ event, result });
  },
  on(event: string, cb: CallableFunction) {
    listeners.set(event, cb);
  },
};

const ipc = new IPC(ipcWorkerWrapper);

export const bridgeRegisterCall = <ParamsType, ReturnType>(
  event: string,
  func: (params: ParamsType) => Promise<ReturnType>,
) => {
  if (listeners.has(event)) {
    sendErrorMessage(`Listener already registered: ${event}`);
    return;
  }

  ipc.register(event, func);
};

export const triggerBridgeEvent = (event: BridgeEvent, result: unknown) => {
  ipc.emit(event, result);
};
