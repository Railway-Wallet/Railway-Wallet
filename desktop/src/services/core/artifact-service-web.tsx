import {
  AppDispatch,
  downloadInitialArtifacts,
  enqueueAsyncToast,
  logDev,
  ToastType,
} from '@react-shared';

const PRELOADED_ARTIFACT_VARIANT_STRINGS: string[] = [
  '1x1',
  '1x2',
  '2x1',
  '2x2',
  '2x3',
  '3x1',
  '4x1',
  '5x1',
];

export class ArtifactServiceWeb {
  dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  downloadAndLoadInitialArtifacts = async () => {
    try {
      await downloadInitialArtifacts(PRELOADED_ARTIFACT_VARIANT_STRINGS);
    } catch (err) {
      logDev(err);
      this.dispatch(
        enqueueAsyncToast({
          message:
            'Could not download initial resources for RAILGUN transactions. Please check your network connection.',
          type: ToastType.Error,
        }),
      );
    }
  };
}
