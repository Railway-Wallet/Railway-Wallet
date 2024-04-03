import {
  BridgeEvent,
  bridgeListen,
  bridgeSetup,
  logDevBridge,
  logDevBridgeError,
  logDevError,
  logDevWaku,
  logDevWakuError,
} from '@react-shared';

export class WorkerBridgeService {
  static start() {
    const worker = new Worker(
      new URL('../../worker/init.tsx', import.meta.url),
    );

    const listeners = new Map<string, CallableFunction>();
    worker.onmessage = ({
      data,
    }: MessageEvent<{ event: string; result: unknown }>) => {
      const listener = listeners.get(data.event);
      if (listener) {
        listener(data.result);
      } else {
        logDevError(
          `Got an event "${data.event}" from the worker without a registered listener`,
        );
      }
    };

    bridgeSetup(
      (event: string, result: unknown) => {
        worker.postMessage({ event, result });
      },
      (event: string, cb: CallableFunction) => {
        listeners.set(event, cb);
      },
    );

    this.addListeners();
  }

  private static addListeners() {
    bridgeListen(BridgeEvent.Message, this.handleMessage);
    bridgeListen(BridgeEvent.Error, this.handleError);
    bridgeListen(BridgeEvent.UncaughtException, this.handleUncaughtException);
    bridgeListen(BridgeEvent.WakuMessage, this.handleWakuMessage);
    bridgeListen(BridgeEvent.WakuError, this.handleWakuError);
  }

  static handleMessage = (msg: string) => {
    logDevBridge(msg);
  };

  static handleError = (msg: string) => {
    logDevBridgeError(msg);
  };

  static handleUncaughtException = (msg: string) => {
    logDevError(`WORKER UNCAUGHT EXCEPTION: ${msg}`);
  };

  static handleWakuMessage = (msg: string) => {
    logDevWaku(msg);
  };

  static handleWakuError = (msg: string) => {
    logDevWakuError(msg);
  };
}
