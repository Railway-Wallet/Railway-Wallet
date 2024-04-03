import {
  startRailgunEngine,
  getProver,
  setOnBalanceUpdateCallback,
  setOnWalletPOIProofProgressCallback,
  setOnUTXOMerkletreeScanCallback,
  setOnTXIDMerkletreeScanCallback,
} from '@railgun-community/wallet';
import LeveldownNodejsMobile from 'leveldown-nodejs-mobile';
import {
  bridgeRegisterCall,
  triggerBridgeEvent,
} from '../../bridge/node-ipc-service';
import { setIsDev } from '../../config/dev-config';
import { createArtifactStore } from './node-railgun-artifacts';
import {
  nativeProveRailgun,
  nativeProvePOI,
  CIRCUITS,
} from '@railgun-privacy/native-prover';
import fs from 'fs';
import {
  BridgeCallEvent,
  BridgeEvent,
  StartRailgunEngineParams,
} from '../../bridge/model';
import {
  MerkletreeScanUpdateEvent,
  POIProofProgressEvent,
  RailgunBalancesEvent,
} from '@railgun-community/shared-models';

export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.promises.access(path);
    return true;
  } catch (_err) {
    return false;
  }
};

bridgeRegisterCall<StartRailgunEngineParams, void>(
  BridgeCallEvent.StartRailgunEngine,
  async ({ dbPath, devMode, documentsDir, walletSource, poiNodeURLs }) => {
    setIsDev(devMode);

    if (await fileExists(`${dbPath}/LOCK`)) {
      await fs.promises.unlink(`${dbPath}/LOCK`);
    }

    const db = new LeveldownNodejsMobile(dbPath);
    const shouldDebug = devMode;
    const useNativeArtifacts = true;

    await startRailgunEngine(
      walletSource,
      db,
      shouldDebug,
      createArtifactStore(documentsDir),
      useNativeArtifacts,
      false, poiNodeURLs,
      undefined,
    );

    setOnBalanceUpdateCallback(onBalanceUpdateCallback);
    setOnWalletPOIProofProgressCallback(onPOIProofProgressCallback);
    setOnUTXOMerkletreeScanCallback(onUTXOMerkletreeScanCallback);
    setOnTXIDMerkletreeScanCallback(onTXIDMerkletreeScanCallback);

    getProver().setNativeProverGroth16(
      nativeProveRailgun,
      nativeProvePOI,
      CIRCUITS,
    );
  },
);

const onBalanceUpdateCallback = (balancesFormatted: RailgunBalancesEvent) => {
  triggerBridgeEvent(BridgeEvent.OnBalancesUpdate, balancesFormatted);
};

const onPOIProofProgressCallback = (
  poiProofProgressEvent: POIProofProgressEvent,
) => {
  triggerBridgeEvent(BridgeEvent.OnPOIProofProgress, poiProofProgressEvent);
};

const onUTXOMerkletreeScanCallback = (eventData: MerkletreeScanUpdateEvent) => {
  triggerBridgeEvent(BridgeEvent.OnUTXOMerkletreeScanUpdate, eventData);
};

const onTXIDMerkletreeScanCallback = (eventData: MerkletreeScanUpdateEvent) => {
  triggerBridgeEvent(BridgeEvent.OnTXIDMerkletreeScanUpdate, eventData);
};
