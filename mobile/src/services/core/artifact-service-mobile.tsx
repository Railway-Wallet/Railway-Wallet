import * as fs from "react-native-fs";
import {
  AppDispatch,
  downloadInitialArtifacts,
  enqueueAsyncToast,
  logDevError,
  ToastType,
} from "@react-shared";

const PRELOAD_INITIAL_ARTIFACTS: string[] = [
  "1x1",
  "1x2",
  "1x3",
  "2x1",
  "2x2",
  "3x1",
  "3x2",
  "4x1",
  "4x2",
  "5x1",
  "5x2",
];

export class ArtifactServiceMobile {
  dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  downloadAndLoadInitialArtifacts = async () => {
    try {
      await downloadInitialArtifacts(
        PRELOAD_INITIAL_ARTIFACTS,
        fs.DocumentDirectoryPath
      );
    } catch (cause) {
      logDevError(new Error("Error downloading initial artifacts", { cause }));
      this.dispatch(
        enqueueAsyncToast({
          message:
            "Could not download initial resources for RAILGUN transactions. Please check your network connection.",
          type: ToastType.Error,
        })
      );
    }
  };
}
