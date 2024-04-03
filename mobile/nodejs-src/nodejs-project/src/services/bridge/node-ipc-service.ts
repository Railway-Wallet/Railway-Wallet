import { sendErrorMessage } from '@railgun-community/wallet';
import { NodejsMobileIPC as IPC } from 'nodejs-mobile-ipc2';
import rnBridge from 'rn-bridge';
import { BridgeCallEvent, BridgeEvent } from './model';

const registeredListeners: BridgeCallEvent[] = [];

const ipcChannelWrapper = {
  ...rnBridge.channel,
  post: <ParamsType>(event: string, result: ParamsType) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return rnBridge.channel.post(event, result);
  },
  on: (event: string, cb: CallableFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return rnBridge.channel.addListener(event, cb);
  },
};

const ipc = new IPC(ipcChannelWrapper);

export const bridgeRegisterCall = <ParamsType, ReturnType>(
  listener: BridgeCallEvent,
  // eslint-disable-next-line no-unused-vars
  func: (params: ParamsType) => Promise<ReturnType>,
) => {
  if (registeredListeners.includes(listener)) {
    sendErrorMessage(`Listener already registered: ${listener}`);
    return;
  }

  ipc.register(listener, func);
  registeredListeners.push(listener);
};

export const triggerBridgeEvent = (event: BridgeEvent, result: unknown) => {
  ipc.emit(event, result);
};
