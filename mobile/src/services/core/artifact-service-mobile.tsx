import * as fs from 'react-native-fs';
import {
  AppDispatch,
  downloadInitialArtifacts,
  enqueueAsyncToast,
  logDevError,
  ToastType,
} from '@react-shared';

const PRELOAD_INITIAL_ARTIFACTS: string[] = [
  '01x01',
  '01x02',
  '01x03',
  '02x01',
  '02x02',
  '03x01',
  '03x02',
  '04x01',
  '04x02',
  '05x01',
  '05x02',
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
        fs.DocumentDirectoryPath,
      );
    } catch (cause) {
      logDevError(new Error('Error downloading initial artifacts', { cause }));
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
