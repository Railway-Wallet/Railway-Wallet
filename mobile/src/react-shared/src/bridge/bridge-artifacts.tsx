import {
  BridgeCallEvent,
  DownloadInitialArtifactsParams,
} from "../models/bridge";
import { bridgeCall } from "./ipc";

export const downloadInitialArtifacts = async (
  preloadArtifactVariantStrings: string[],
  documentsDir: string = ""
): Promise<void> => {
  return bridgeCall<DownloadInitialArtifactsParams, void>(
    BridgeCallEvent.DownloadInitialArtifacts,
    {
      preloadArtifactVariantStrings,
      documentsDir,
    }
  );
};
