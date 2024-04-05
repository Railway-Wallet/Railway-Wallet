import { ArtifactStore, ArtifactDownloader } from '@railgun-community/wallet';
import fs from 'fs';
import {
  bridgeRegisterCall,
  triggerBridgeEvent,
} from '../../bridge/node-ipc-service';
import {
  BridgeCallEvent,
  BridgeEvent,
  DownloadInitialArtifactsParams,
} from '../../bridge/model';
import { sendMessage } from '../../bridge/loggers';

export const createDownloadDirPath = (documentsDir: string, path: string) => {
  return `${documentsDir}/${path}`;
};

export const createArtifactStore = (documentsDir: string): ArtifactStore => {
  const getFile = async (path: string) => {
    return fs.promises.readFile(createDownloadDirPath(documentsDir, path));
  };

  const storeFile = async (
    dir: string,
    path: string,
    item: string | Uint8Array,
  ) => {
    await fs.promises.mkdir(createDownloadDirPath(documentsDir, dir), {
      recursive: true,
    });
    await fs.promises.writeFile(
      createDownloadDirPath(documentsDir, path),
      item,
    );
  };

  const fileExists = (path: string): Promise<boolean> => {
    return new Promise(resolve => {
      fs.promises
        .access(createDownloadDirPath(documentsDir, path))
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  };

  return new ArtifactStore(getFile, storeFile, fileExists);
};

bridgeRegisterCall<DownloadInitialArtifactsParams, void>(
  BridgeCallEvent.DownloadInitialArtifacts,
  async ({ preloadArtifactVariantStrings, documentsDir }) => {
    const artifactStore = createArtifactStore(documentsDir);

    const useNativeArtifacts = true;
    const downloader = new ArtifactDownloader(
      artifactStore,
      useNativeArtifacts,
    );

    triggerBridgeEvent(BridgeEvent.OnArtifactsProgress, 0);
    for (let i = 0; i < preloadArtifactVariantStrings.length; i += 1) {
      const artifactVariantString = preloadArtifactVariantStrings[i];
      // eslint-disable-next-line no-await-in-loop
      await downloader.downloadArtifacts(artifactVariantString);
      sendMessage(`Downloaded artifacts for variant: ${artifactVariantString}`);
      triggerBridgeEvent(
        BridgeEvent.OnArtifactsProgress,
        (i + 1) / preloadArtifactVariantStrings.length,
      );
    }
  },
);
