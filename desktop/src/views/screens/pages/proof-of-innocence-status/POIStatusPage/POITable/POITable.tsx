import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { Text } from '@components/Text/Text';
import {
  logDevError,
  POIsPerList,
  styleguide,
  TXOsReceivedPOIStatusInfo,
  TXOsSpentPOIStatusInfo,
} from '@react-shared';
import {
  POIStatusViewType,
  TableReadType,
} from '@screens/pages/proof-of-innocence-status/POIStatusPage/POIStatusPage';
import styles from './POITable.module.scss';

type Props = {
  data: TXOsSpentPOIStatusInfo[] | TXOsReceivedPOIStatusInfo[];
  columns: string[];
  viewType: POIStatusViewType;
  readType: TableReadType;
  handleRefreshRow: (railgunTxid?: string) => Promise<void>;
  handleGeneratePOI: (railgunTxid: string) => Promise<void>;
};

export const POITable = ({
  data,
  columns,
  viewType,
  readType,
  handleRefreshRow,
  handleGeneratePOI,
}: Props) => {
  const [generatePOILoading, setGeneratePOILoading] = useState<string[]>([]);

  const getSerializedData = () => {
    const isEmoji = readType === TableReadType.Emoji;
    if (viewType === POIStatusViewType.Received) {
      const dataToSerialize = data as TXOsReceivedPOIStatusInfo[];

      return dataToSerialize.map(({ emojis, strings }) => {
        const itemData = isEmoji ? emojis : strings;

        return {
          treePosition: `${itemData.tree} / ${itemData.position}`,
          txid: itemData.txid,
          commitment: itemData.commitment,
          poisPerList: itemData.poisPerList,
        };
      });
    } else {
      const dataToSerialize = data as TXOsSpentPOIStatusInfo[];
      return dataToSerialize.map(({ emojis, strings }) => {
        return {
          blockNumber: strings.blockNumber,
          txid: strings.txid,
          railgunTxid: strings.railgunTxid,
          poiStatusesSpentTXOs: strings.poiStatusesSpentTXOs,
          poiStatusesSentCommitments: strings.poiStatusesSentCommitments,
          poiStatusesUnshieldEvents: strings.poiStatusesUnshieldEvents,
          listKeysCanGenerateSpentPOIs: strings.listKeysCanGenerateSpentPOIs,
        };
      });
    }
  };

  const serializedData = getSerializedData();

  const renderValueWithLoading = (
    value: string | number | Optional<POIsPerList>[],
    index: number,
  ) => {
    if (typeof value !== 'object') {
      return (
        <td key={index}>
          {!isDefined(value) ? (
            <Spinner size={20} color={styleguide.colors.black} />
          ) : (
            <Text
              className={cn(styles.tableValue, 'text-select')}
              color={styleguide.colors.black}
              key={index}
            >{`${value}`}</Text>
          )}
        </td>
      );
    }

    const arrayOfValuesAndKeys =
      value?.length > 0
        ? Object.entries(value).map(([key, value]) => ({
            key,
            value,
          }))
        : [];

    return (
      <td key={`td-render-${index}`}>
        {arrayOfValuesAndKeys.map((item, index) => {
          if (!isDefined(item)) {
            return (
              <Spinner
                key={`loading-${index}`}
                size={20}
                color={styleguide.colors.black}
              />
            );
          }

          const { key, value } = item;
          return (
            <Text
              className={cn(styles.tableValue, 'text-select')}
              color={styleguide.colors.black}
              key={index}
            >{`${key}: ${JSON.stringify(value)}`}</Text>
          );
        })}
      </td>
    );
  };

  const generatePOI = (railgunTxid: string) => async () => {
    const filteredGeneratePOILoading = generatePOILoading.filter(
      item => item !== railgunTxid,
    );
    try {
      setGeneratePOILoading([...generatePOILoading, railgunTxid]);

      await handleGeneratePOI(railgunTxid);

      await handleRefreshRow(railgunTxid);

      setGeneratePOILoading(filteredGeneratePOILoading);
    } catch (cause) {
      logDevError(new Error('Error generating POI', { cause }));
      setGeneratePOILoading(filteredGeneratePOILoading);
    }
  };

  const refreshRow = (railgunTxid: string) => async () => {
    await handleRefreshRow(railgunTxid);
  };

  const isTXIDLoading = (txid: string): boolean =>
    generatePOILoading?.includes(txid);

  return (
    <>
      {data.length === 0 ? (
        <div className={styles.spinnerContainer}>
          <Spinner size={50} />
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(column => (
                <th className={styles.tableHeader} key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {serializedData.map((item, index) => {
              const isOdd = index % 2 === 0;
              const itemArray = Object.values(item);

              const railgunTxid =
                'railgunTxid' in item ? item.railgunTxid : 'INVALID_TXID';
              const enableGeneratePOIButton =
                'listKeysCanGenerateSpentPOIs' in item
                  ? item.listKeysCanGenerateSpentPOIs.length > 0
                  : false;

              return (
                <tr
                  key={`${railgunTxid}-${index}`}
                  className={cn(styles.tableRow, {
                    [styles.tableRowOdd]: isOdd,
                  })}
                >
                  {itemArray.map(renderValueWithLoading)}
                  <td>
                    <div className={styles.actionsContainer}>
                      {viewType === POIStatusViewType.Received ? (
                        <Button
                          buttonClassName={styles.action}
                          onClick={refreshRow(railgunTxid)}
                        >
                          Refresh
                        </Button>
                      ) : (
                        <>
                          {enableGeneratePOIButton && (
                            <Button
                              onClick={generatePOI(railgunTxid)}
                              buttonClassName={styles.action}
                              loading={isTXIDLoading(item.txid)}
                            >
                              Generate Private POIs
                            </Button>
                          )}
                          <Button
                            buttonClassName={styles.action}
                            onClick={refreshRow(railgunTxid)}
                          >
                            Refresh
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
};
