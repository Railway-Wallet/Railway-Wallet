import { isDefined } from '@railgun-community/shared-models';
import { ArtifactStore } from '@railgun-community/wallet';
import localforage from 'localforage';

export class LocalForageArtifactStore extends ArtifactStore {
  constructor() {
    super(
      async (path: string) => {
        return localforage.getItem(path);
      },
      async (_dir: string, path: string, item: string | Uint8Array) => {
        await localforage.setItem(path, item);
      },
      async (path: string) => isDefined(await localforage.getItem(path)),
    );
  }
}
