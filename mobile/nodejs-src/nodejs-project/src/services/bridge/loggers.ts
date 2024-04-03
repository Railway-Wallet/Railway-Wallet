import { BridgeEvent } from './model';
import { isDev } from '../config/dev-config';
import { triggerBridgeEvent } from './node-ipc-service';

export const sendMessage = (msg: string) => {
  if (!isDev()) {
    return;
  }
  triggerBridgeEvent(BridgeEvent.Message, msg);
};

export const sendError = (error?: Error | string) => {
  if (!error) {
    return;
  }
  if (!isDev()) {
    return;
  }
  if (error instanceof Error) {
    triggerBridgeEvent(BridgeEvent.Error, error.message);
    triggerBridgeEvent(BridgeEvent.Error, error.stack);
  } else {
    triggerBridgeEvent(BridgeEvent.Error, error);
  }
};

export const sendWakuMessage = (msg: string) => {
  if (!isDev()) {
    return;
  }
  triggerBridgeEvent(BridgeEvent.WakuMessage, msg);
};

export const sendWakuError = (error?: Error | string) => {
  if (!error) {
    return;
  }
  if (!isDev()) {
    return;
  }
  if (error instanceof Error) {
    triggerBridgeEvent(BridgeEvent.WakuError, error.message);
    triggerBridgeEvent(BridgeEvent.WakuError, error.stack);
  } else {
    triggerBridgeEvent(BridgeEvent.WakuError, error);
  }
};
