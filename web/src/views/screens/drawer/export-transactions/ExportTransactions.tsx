import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Selector } from '@components/Selector/Selector';
import { Text } from '@components/Text/Text';
import {
  CalloutType,
  convertToExportedTransactions,
  ExportedSavedTransaction,
  getNetworkFrontendConfig,
  getWalletTransactionHistory,
  KoinlyTransactionHistory,
  logDevError,
  RailgunTransactionHistorySync,
  shouldEnableKoinlyTaxExport,
  styleguide,
  useAppDispatch,
  useFilteredNetworkTransactions,
  useFilteredNetworkTransactionsMissingTimestamp,
  useReduxSelector,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { downloadCSV } from '@services/util/csv-downloader';
import { IconType } from '@services/util/icon-service';
import {
  allYearsOption,
  ExportOption,
  ExportType,
  getScreenDataFromExportType,
  getTransactionExportOptions,
  getUTCString,
  YearOption,
} from '@utils/export-transactions';
import { humanReadableFields, koinlyFields } from './CSV';
import styles from './ExportTransactions.module.scss';

export const ExportTransactions = () => {
  const koinlyTransactionHistory = new KoinlyTransactionHistory();
  const dispatch = useAppDispatch();
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkTransactions } = useFilteredNetworkTransactions(
    false,
  );
  const { networkTransactionsMissingTimestamp } =
    useFilteredNetworkTransactionsMissingTimestamp();
  const activeWallet = wallets.active;
  const exportOptions = getTransactionExportOptions(
    shouldEnableKoinlyTaxExport(network.current.name),
  );

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedExportOption, setSelectedExportOption] =
    useState<ExportOption>(exportOptions[0]);
  const [selectedYearOption, setSelectedYearOption] =
    useState<YearOption>(allYearsOption);
  const [
    missingReceiptDataTransactionCount,
    setMissingReceiptDataTransactionCount,
  ] = useState<number>(0);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const getMissingReceiptDataTransactions = async () => {
    const count =
      await koinlyTransactionHistory.resyncAndCountTransactionsMissingReceiptData(
        getWalletTransactionHistory,
      );
    setMissingReceiptDataTransactionCount(count);
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getMissingReceiptDataTransactions();
  });

  if (!activeWallet) {
    return null;
  }

  const handleKoinlyExport = async (year?: string) => {
    const koinlyTransactions = await koinlyTransactionHistory.getHistory(
      network.current.name,
      getWalletTransactionHistory,
      year,
    );

    if (!koinlyTransactions) {
      throw new Error('No transactions found for tax export.');
    }

    const filename = `railway-koinly-${getUTCString()}-${
      network.current.shortPublicName
    }-${activeWallet.name}`;

    downloadCSV(koinlyFields, koinlyTransactions, filename);
  };

  const handleHumanReadableExport = async (year?: string) => {
    const items: ExportedSavedTransaction[] =
      await convertToExportedTransactions(
        [...networkTransactions, ...networkTransactionsMissingTimestamp],
        network.current,
        activeWallet,
        wallets.available,
      );

    const filteredItems =
      isDefined(year) && year !== ''
        ? items.filter(
            transaction =>
              new Date(transaction.utcDate).getFullYear().toString() === year,
          )
        : items;

    const filename = `railway-readable-${getUTCString()}-${
      network.current.shortPublicName
    }-${activeWallet.name}`;
    downloadCSV(humanReadableFields, filteredItems, filename);
  };

  const exportTransactions = async () => {
    setIsExporting(true);
    try {
      const year =
        selectedYearOption.value !== allYearsOption.value
          ? selectedYearOption.value
          : undefined;

      switch (selectedExportOption.value) {
        case ExportType.HumanReadable:
          await handleHumanReadableExport(year);
          break;

        case ExportType.Koinly:
          await handleKoinlyExport(year);
          break;
      }
    } catch (cause) {
      const error = new Error('Error exporting transactions', { cause });
      logDevError(error);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
    setIsExporting(false);
  };

  const resyncTransactions = async () => {
    setIsSyncing(true);
    try {
      await RailgunTransactionHistorySync.unsafeSyncTransactionHistory(
        dispatch,
        network.current,
        getWalletTransactionHistory,
      );
    } catch (cause) {
      const error = new Error('Failed to resync transactions', { cause });
      logDevError(error);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
    setIsSyncing(false);
  };

  const frontendConfig = getNetworkFrontendConfig(network.current.name);
  const { description, yearSelectorTitle, yearsOptions } =
    getScreenDataFromExportType(selectedExportOption.value);
  const showMissingDetailsForTransactions =
    networkTransactionsMissingTimestamp.length > 0;

  const showMissingReceiptData = missingReceiptDataTransactionCount > 0;
  const missingReceiptDataText =
    missingReceiptDataTransactionCount > 1
      ? `Warning: ${missingReceiptDataTransactionCount} transactions are missing receipt data.`
      : `Warning: ${missingReceiptDataTransactionCount} transaction is missing receipt data.`;

  return (
    <div className={styles.container}>
      {showMissingDetailsForTransactions ? (
        <>
          <Text className={styles.syncText}>
            {`Missing details for ${networkTransactionsMissingTimestamp.length} synced transactions.`}
          </Text>
          <Text className={cn(styles.syncText, styles.syncDescription)}>
            Transaction exports require full history for accuracy. Please
            re-sync your transaction history to continue.
          </Text>
          <Button
            loading={isSyncing}
            disabled={isSyncing}
            endIcon={IconType.Refresh}
            onClick={resyncTransactions}
            buttonClassName={styles.syncButton}
          >
            Re-Sync Transactions
          </Button>
        </>
      ) : (
        <>
          <InfoCallout
            type={CalloutType.Info}
            borderColor={frontendConfig.backgroundColor}
            gradientColors={frontendConfig.gradientColors}
            text={`Download your transactions list for ${wallets.active?.name} on ${network.current.shortPublicName} network.`}
          />
          {showMissingReceiptData && (
            <InfoCallout
              type={CalloutType.Warning}
              text={missingReceiptDataText}
              className={styles.warningCallout}
              ctaButton="Re-sync transactions"
              borderColor={styleguide.colors.danger}
              onCtaPress={getMissingReceiptDataTransactions}
              gradientColors={styleguide.colors.gradients.redCallout.colors}
            />
          )}
          <Text className={styles.titleText}>Export type</Text>
          <Selector
            value={selectedExportOption}
            options={exportOptions}
            testId="export-option-selector"
            placeholder="Select Export Type"
            containerClassName={styles.selector}
            onValueChange={option =>
              setSelectedExportOption(option as ExportOption)
            }
          />
          <Text className={styles.titleText}>{yearSelectorTitle}</Text>
          <Selector
            value={selectedYearOption}
            options={yearsOptions}
            testId="export-option-selector"
            placeholder="Select year"
            containerClassName={styles.selector}
            onValueChange={yearOption =>
              setSelectedYearOption(yearOption as YearOption)
            }
          />
          <Text className={styles.captionText}>{description}</Text>
          <Button
            endIcon={IconType.Download}
            onClick={exportTransactions}
            buttonClassName={styles.downloadButton}
            loading={isExporting}
            disabled={isExporting}
          >
            Export as CSV
          </Button>
        </>
      )}
      {errorModal && <ErrorDetailsModal {...errorModal} />}
    </div>
  );
};
