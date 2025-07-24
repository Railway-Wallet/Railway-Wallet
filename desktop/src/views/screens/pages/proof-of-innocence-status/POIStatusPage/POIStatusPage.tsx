import { isDefined } from '@railgun-community/shared-models';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import {
  generateAllPOIsForWallet,
  generatePOIsForWalletAndRailgunTxid,
  getTXOsReceivedPOIStatusInfoForWallet,
  getTXOsSpentPOIStatusInfoForWallet,
  refreshReceivePOIsForWallet,
  refreshSpentPOIsForWallet,
  TXOsReceivedPOIStatusInfo,
  TXOsSpentPOIStatusInfo,
  useReduxSelector,
} from '@react-shared';
import { IconType } from '@services/util/icon-service';
import {
  AlertProps,
  GenericAlert,
} from '@views/components/alerts/GenericAlert/GenericAlert';
import { WalletsSelectionContainer } from '@views/screens/tabs/Wallets/WalletsScreen/WalletsSelectionContainer/WalletsSelectionContainer';
import { WalletStatusBar } from '@views/screens/tabs/Wallets/WalletsScreen/WalletStatusBar/WalletStatusBar';
import { POITable } from './POITable/POITable';
import styles from './POIStatusPage.module.scss';

export enum POIStatusViewType {
  Received = 'Received TXOs',
  Spent = 'Spent TXOs',
}

export enum TableReadType {
  Emoji = 'Emoji',
  Text = 'Text',
}

const RECEIVED_COLUMNS: string[] = [
  'Tree position',
  'Network TXID',
  'Commitment',
  'Private POI per list',
  'Actions',
];

const SPENT_COLUMNS: string[] = [
  'Block',
  'Network TXID',
  'RAILGUN TXID',
  'Private POI status: required TXOs',
  'Private POI status: commitments',
  'Private POI status: unshields (out)',
  'Provable lists',
  'Actions',
];

export const POIStatusPage = () => {
  const { wallets } = useReduxSelector('wallets');
  const { network } = useReduxSelector('network');
  const { txidVersion } = useReduxSelector('txidVersion');

  const [showWalletSelectorModal, setShowWalletSelectorModal] = useState(false);
  const [viewType, setViewType] = useState<POIStatusViewType>(
    POIStatusViewType.Spent,
  );
  const [tableReadType, setTableReadType] = useState<TableReadType>(
    TableReadType.Text,
  );
  const [alert, setAlert] = useState<Optional<AlertProps>>();
  const [dataSpent, setDataSpent] = useState<TXOsSpentPOIStatusInfo[]>();
  const [dataReceived, setDataReceived] =
    useState<TXOsReceivedPOIStatusInfo[]>();

  const networkName = network.current.name;
  const railWalletID = wallets.active?.railWalletID;
  const columns =
    viewType === POIStatusViewType.Received ? RECEIVED_COLUMNS : SPENT_COLUMNS;
  const data = useMemo(
    () => (viewType === POIStatusViewType.Received ? dataReceived : dataSpent),
    [dataReceived, dataSpent, viewType],
  );

  const getAndSetReceivedData = useCallback(async () => {
    if (!isDefined(railWalletID)) return;

    setDataReceived(
      await getTXOsReceivedPOIStatusInfoForWallet(
        txidVersion.current,
        networkName,
        railWalletID,
      ),
    );
  }, [networkName, railWalletID, txidVersion]);

  const getAndSetSpentData = useCallback(async () => {
    if (!isDefined(railWalletID)) return;

    setDataSpent(
      await getTXOsSpentPOIStatusInfoForWallet(
        txidVersion.current,
        networkName,
        railWalletID,
      ),
    );
  }, [networkName, railWalletID, txidVersion]);

  useEffect(() => {
    if (isDefined(railWalletID)) {
      switch (viewType) {
        case POIStatusViewType.Received:
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          getAndSetReceivedData();
          break;

        case POIStatusViewType.Spent:
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          getAndSetSpentData();
          break;
      }
    }
  }, [
    networkName,
    railWalletID,
    getAndSetReceivedData,
    getAndSetSpentData,
    viewType,
  ]);

  const handleToggleView = () => {
    switch (viewType) {
      case POIStatusViewType.Received:
        setViewType(POIStatusViewType.Spent);
        break;
      case POIStatusViewType.Spent:
        setViewType(POIStatusViewType.Received);
        break;
    }
  };

  const generatePOIsForRailgunTxid = async (railgunTxid: string) => {
    if (!isDefined(railWalletID)) return;
    await generatePOIsForWalletAndRailgunTxid(
      txidVersion.current,
      networkName,
      railWalletID,
      railgunTxid,
    );
  };

  const promptGenerateAllPOIs = () => {
    setAlert({
      title: 'Generate all Private POIs',
      message:
        'This action will generate all the Private Proofs of Innocence for your transactions, it can take a few minutes.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Generate',
      onSubmit: async () => {
        setAlert(undefined);
        await generateAllPOIs();
      },
    });
  };

  const generateAllPOIs = async () => {
    if (!isDefined(railWalletID)) return;
    await generateAllPOIsForWallet(networkName, railWalletID);
  };

  const refreshPOIsForWallet = async (railgunTxid?: string) => {
    if (!isDefined(railWalletID)) return;

    switch (viewType) {
      case POIStatusViewType.Received:
        await refreshReceivePOIsForWallet(
          txidVersion.current,
          networkName,
          railWalletID,
        );
        await getAndSetReceivedData();
        break;

      case POIStatusViewType.Spent:
        await refreshSpentPOIsForWallet(
          txidVersion.current,
          networkName,
          railWalletID,
          railgunTxid,
        );
        await getAndSetSpentData();
        break;
    }
  };

  const handleRefreshAll = async () => {
    await refreshPOIsForWallet();
  };

  const refreshRow = async (railgunTxid?: string) => {
    await refreshPOIsForWallet(railgunTxid);
  };

  return (
    <>
      <div className={styles.poiStatusContainer}>
        <WalletStatusBar
          isRailgun
          hidePrivatePublicButton
          displayingAssetDescription="Private POI Status"
          setShowWalletSelectorModal={setShowWalletSelectorModal}
        />
        <WalletsSelectionContainer
          isRailgun
          showWalletSelectorModal={showWalletSelectorModal}
          setShowWalletSelectorModal={setShowWalletSelectorModal}
        />
        <div className={styles.contentContainer}>
          <Text className={styles.poiTitle}>Private POI Status</Text>
          <Text className={styles.poiSubtitle}>
            View private proof-of-innocence status of your transactions.
          </Text>
          <div className={styles.content}>
            <div className={styles.buttonsContainer}>
              <Button
                alt="switch sent received"
                onClick={handleToggleView}
                buttonClassName={styles.switchViewTypeButton}
              >
                {viewType}
              </Button>
              <Button
                endIcon={IconType.Refresh}
                alt="refresh all"
                onClick={handleRefreshAll}
              >
                Update
              </Button>
              <Button
                endIcon={IconType.Calculator}
                alt="generate all"
                onClick={promptGenerateAllPOIs}
                buttonClassName={styles.generateAllButton}
              >
                Generate all Private POIs
              </Button>
              {}
            </div>
            <POITable
              data={data ?? []}
              columns={columns}
              viewType={viewType}
              readType={tableReadType}
              handleRefreshRow={refreshRow}
              handleGeneratePOI={generatePOIsForRailgunTxid}
            />
          </div>
        </div>
      </div>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
