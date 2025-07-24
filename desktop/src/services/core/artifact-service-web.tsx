import {
  AppDispatch,
  downloadInitialArtifacts,
  enqueueAsyncToast,
  logDev,
  ToastType,
} from '@react-shared';

const PRELOADED_ARTIFACT_VARIANT_STRINGS: string[] = [
  '01x01',
  '01x02',
  '02x01',
  '02x02',
  '02x03',
  '03x01',
  '04x01',
  '05x01',
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
