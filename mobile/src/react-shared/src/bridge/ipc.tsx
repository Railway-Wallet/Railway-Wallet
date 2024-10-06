import { IPCEventHandler, NodejsMobileIPC as IPC } from "nodejs-mobile-ipc2";
import { BridgeCallEvent, BridgeEvent } from "../models/bridge";
import { logDevBridge, logDevBridgeError } from "../utils";

let ipc: Optional<IPC>;

export const bridgeSetup = (
  post: <ParamsType>(event: BridgeCallEvent, result: ParamsType) => void,
  on: (event: BridgeCallEvent, cb: IPCEventHandler) => void
) => {
  ipc = new IPC({ post, on });
};

export const bridgeCall = async <ParamsType, ReturnType>(
  event: BridgeCallEvent,
  params: ParamsType,
  skipBridgeLogs = false
): Promise<ReturnType> => {
  if (!ipc) {
    throw new Error("Bridge IPC not set up");
  }
  !skipBridgeLogs && logDevBridge(`BRIDGE (CALL): ${event}`, params);
  try {
    const result = await ipc.call(event, params);
    !skipBridgeLogs && logDevBridge(`BRIDGE (RESULT): ${event}`, result);
    return result;
  } catch (err) {
    !skipBridgeLogs && logDevBridge(`BRIDGE (ERROR): ${event}`);
    !skipBridgeLogs && logDevBridgeError(err);
    throw err;
  }
};

export const bridgeListen = (event: BridgeEvent, cb: IPCEventHandler) => {
  if (!ipc) {
    throw new Error("Bridge IPC not set up");
  }

  ipc.on(event, cb);
};
