import { Alert } from "react-native";
import {
  BridgeEvent,
  bridgeListen,
  bridgeSetup,
  logDevBridge,
  logDevBridgeError,
  logDevError,
  logDevWaku,
  logDevWakuError,
  ReactConfig,
} from "@react-shared";
import nodejs from "nodejs-mobile-react-native";

export class NodeBridgeService {
  private static isRunning = false;

  static start() {
    if (this.isRunning) {
      return;
    }
    nodejs.start("init.js");
    bridgeSetup(
      (event, result) => {
        nodejs.channel.post(event, result);
      },
      (event, cb) => {
        nodejs.channel.addListener(event, cb);
      }
    );
    this.addListeners();
    this.isRunning = true;
  }

  private static addListeners() {
    if (this.isRunning) {
      return;
    }
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
    if (ReactConfig.IS_DEV) {
      Alert.alert("Uncaught NODE exception", msg);
      return;
    }
    logDevError(`NODE UNCAUGHT EXCEPTION: ${msg}`);
  };

  static handleWakuMessage = (msg: string) => {
    logDevWaku(msg);
  };

  static handleWakuError = (msg: string) => {
    logDevWakuError(msg);
  };
}
