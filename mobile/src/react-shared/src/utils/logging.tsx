/* eslint-disable @typescript-eslint/no-explicit-any */
import debug, { Debugger } from "debug";
import { ReactConfig } from "../config/react-config";
import { SharedConstants } from "../config/shared-constants";

enum Logger {
  AppLogs = "railway:log",
  AppError = "railway:error",
  ReduxLogs = "railway:redux",
  BridgeLogs = "railway:backend",
  BridgeError = "railway:backend:error",
  WakuLogs = "railway:waku",
  WakuError = "railway:waku:error",
}

const loggerOptions: Record<Logger, { color: string }> = {
  [Logger.AppLogs]: { color: "blue" },
  [Logger.ReduxLogs]: { color: "cyan" },
  [Logger.AppError]: { color: "red" },
  [Logger.BridgeLogs]: { color: "magenta" },
  [Logger.BridgeError]: { color: "red" },
  [Logger.WakuLogs]: { color: "grey" },
  [Logger.WakuError]: { color: "red" },
};

const loggers: Partial<Record<Logger, Debugger>> = {};
for (const logger of Object.values(Logger)) {
  const dbg = debug(logger);
  dbg.color = loggerOptions[logger].color;
  loggers[logger] = dbg;
}

function* listErrorCauses(err: Error) {
  let currentErr: Error = err;
  yield currentErr?.message ?? String(currentErr);
  currentErr = currentErr?.cause as Error;
  while (currentErr?.message ?? currentErr) {
    yield `caused by "${currentErr?.message ?? String(currentErr)}"`;
    currentErr = currentErr?.cause as Error;
  }
}

export const logDev = (...message: any) => {
  logDbg(loggers[Logger.AppLogs], ...message);
};

export const logDevError = (...messages: any) => {
  if (messages.length === 1 && messages[0] instanceof Error) {
    logDbg(loggers[Logger.AppError], messages[0].stack);
    for (const msg of listErrorCauses(messages[0])) {
      logDbg(loggers[Logger.AppError], msg);
    }
  } else {
    logDbg(loggers[Logger.AppError], ...messages);
  }
};

export const logDevRedux = (...messages: any) => {
  if (!SharedConstants.SHOW_DEV_LOGS_REDUX) {
    return;
  }
  logDbg(loggers[Logger.ReduxLogs], ...messages);
};

export const logDevBridge = (...messages: any) => {
  logDbg(loggers[Logger.BridgeLogs], ...messages);
};

export const logDevBridgeError = (...messages: any) => {
  if (messages.length === 1 && messages[0] instanceof Error) {
    for (const msg of listErrorCauses(messages[0])) {
      logDbg(loggers[Logger.BridgeError], msg);
    }
  } else {
    logDbg(loggers[Logger.BridgeError], ...messages);
  }
};

export const logDevWaku = (...messages: any) => {
  logDbg(loggers[Logger.WakuLogs], ...messages);
};

export const logDevWakuError = (...messages: any) => {
  logDbg(loggers[Logger.WakuError], ...messages);
};

const logDbg = (dbg: Optional<debug.Debugger>, ...messages: any) => {
  if (!ReactConfig.IS_DEV) {
    return;
  }
  if (!dbg) {
    return;
  }
  if (process.env.NODE_ENV === "test") {
    return;
  }
  for (const msg of messages) {
    dbg(msg);
  }
};
