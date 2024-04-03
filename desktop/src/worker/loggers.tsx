import { isDefined } from '@railgun-community/shared-models';
import { BridgeEvent } from '@react-shared';
import { isDev } from './config/dev-config';
import { triggerBridgeEvent } from './worker-ipc-service';

export const sendMessage = (msg: string) => {
  if (!isDev()) {
    return;
  }
  triggerBridgeEvent(BridgeEvent.Message, msg);
};

export const sendError = (error?: Error | string) => {
  if (!isDefined(error)) {
    return;
  }
  if (!isDev()) {
    return;
  }
  triggerBridgeEvent(BridgeEvent.Error, error);
};

export const sendWakuMessage = (msg: string) => {
  if (!isDev()) {
    return;
  }
  triggerBridgeEvent(BridgeEvent.WakuMessage, msg);
};

export const sendWakuError = (error?: Error | string) => {
  if (!isDefined(error)) {
    return;
  }
  if (!isDev()) {
    return;
  }
  triggerBridgeEvent(BridgeEvent.WakuError, error);
};
