import { ArtifactDownloader } from '@railgun-community/wallet';
import { BridgeCallEvent, DownloadInitialArtifactsParams } from '@react-shared';
import { LocalForageArtifactStore } from '@services/storage/local-forage-artifact-store';
import { sendMessage } from './loggers';
import { bridgeRegisterCall } from './worker-ipc-service';

bridgeRegisterCall<DownloadInitialArtifactsParams, void>(
  BridgeCallEvent.DownloadInitialArtifacts,
  async ({ preloadArtifactVariantStrings }) => {
    const artifactStore = new LocalForageArtifactStore();

    const useNativeArtifacts = false;
    const downloader = new ArtifactDownloader(
      artifactStore,
      useNativeArtifacts,
    );

    preloadArtifactVariantStrings.forEach(async artifactVariantString => {
      await downloader.downloadArtifacts(artifactVariantString);
      sendMessage(`Downloaded artifacts for variant: ${artifactVariantString}`);
    });
  },
);
