import {
  isDefined,
  MerkletreeScanUpdateEvent,
  POIProofProgressEvent,
  RailgunBalancesEvent,
} from '@railgun-community/shared-models';
import {
  getProver,
  POIList,
  POIListType,
  setOnBalanceUpdateCallback,
  setOnTXIDMerkletreeScanCallback,
  setOnUTXOMerkletreeScanCallback,
  setOnWalletPOIProofProgressCallback,
  SnarkJSGroth16,
  startRailgunEngine,
} from '@railgun-community/wallet';
import debug from 'debug';
import snarkjs from '@assets/libs/snarkjs.min.js';
import {
  BridgeCallEvent,
  BridgeEvent,
  StartRailgunEngineParams,
  StorageService,
} from '@react-shared';
import { LocalForageWrapper } from '@services/storage/local-forage';
import { LocalForageArtifactStore } from '@services/storage/local-forage-artifact-store';
import { Constants } from '@utils/constants';
import LevelDB from 'level-js';
import { setIsDev } from './config/dev-config';
import { bridgeRegisterCall, triggerBridgeEvent } from './worker-ipc-service';

bridgeRegisterCall<StartRailgunEngineParams, void>(
  BridgeCallEvent.StartRailgunEngine,
  async ({ dbPath, devMode, walletSource, poiNodeURLs }) => {
    setIsDev(devMode);

    const db = new LevelDB(dbPath);
    const shouldDebug = devMode;

    debug.enable(shouldDebug ? 'railway:*' : '');

    const artifactStore = new LocalForageArtifactStore();

    LocalForageWrapper.init();
    StorageService.init(LocalForageWrapper);

    const alreadyAddedPOILists = await StorageService.getItem(
      Constants.POI_CUSTOM_LISTS,
    );
    const customPOIListKeys: string[] = isDefined(alreadyAddedPOILists)
      ? JSON.parse(alreadyAddedPOILists)
      : undefined;
    const customPOILists: Optional<POIList[]> = customPOIListKeys?.map(
      listKey => ({
        key: listKey,
        type: POIListType.Active,
        name: 'Custom list',
        description: 'Custom list added by user',
      }),
    );

    await startRailgunEngine(
      walletSource,
      db,
      shouldDebug,
      artifactStore,
      false, false, poiNodeURLs,
      customPOILists,
    );

    setOnBalanceUpdateCallback(onBalanceUpdateCallback);
    setOnWalletPOIProofProgressCallback(onPOIProofProgressCallback);
    setOnUTXOMerkletreeScanCallback(onUTXOMerkletreeScanCallback);
    setOnTXIDMerkletreeScanCallback(onTXIDMerkletreeScanCallback);

    const prover = getProver();
    prover.setSnarkJSGroth16(snarkjs.groth16 as SnarkJSGroth16);
  },
);

const onBalanceUpdateCallback = (balancesFormatted: RailgunBalancesEvent) => {
  triggerBridgeEvent(BridgeEvent.OnBalancesUpdate, balancesFormatted);
};

const onUTXOMerkletreeScanCallback = (eventData: MerkletreeScanUpdateEvent) => {
  triggerBridgeEvent(BridgeEvent.OnUTXOMerkletreeScanUpdate, eventData);
};

const onTXIDMerkletreeScanCallback = (eventData: MerkletreeScanUpdateEvent) => {
  triggerBridgeEvent(BridgeEvent.OnTXIDMerkletreeScanUpdate, eventData);
};

const onPOIProofProgressCallback = (
  poiProofProgress: POIProofProgressEvent,
) => {
  triggerBridgeEvent(BridgeEvent.OnPOIProofProgress, poiProofProgress);
};
