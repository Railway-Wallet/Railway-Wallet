import { BridgeCallEvent, StartRailgunEngineParams } from "../models/bridge";
import { bridgeCall } from "./ipc";

export const startRailgunEngine = (
  walletSource: string,
  dbPath: string,
  devMode: boolean,
  documentsDir: string = "",
  poiNodeURLs: Optional<string[]>
): Promise<void> => {
  return bridgeCall<StartRailgunEngineParams, void>(
    BridgeCallEvent.StartRailgunEngine,
    {
      walletSource,
      dbPath,
      devMode,
      documentsDir,
      poiNodeURLs,
    }
  );
};
