import { ExportedSavedTransaction } from '@react-shared';
import { DownloadField } from '@services/util/csv-downloader';

export const humanReadableFields: DownloadField<ExportedSavedTransaction>[] = [
  {
    label: 'Hash',
    name: 'hash',
  },
  {
    label: 'Status',
    name: 'statusText',
  },
  {
    label: 'Timestamp',
    name: 'utcDate',
  },
  {
    label: 'Type',
    name: 'publicPrivateType',
  },
  {
    label: 'Action',
    name: 'action',
  },
  {
    label: 'Network',
    name: 'networkPublicName',
  },
  {
    label: 'Wallet',
    name: 'walletAddress',
  },
  {
    label: 'Link',
    name: 'link',
  },
  {
    label: 'Transaction details',
    name: 'readableTransactionText',
  },
  {
    label: 'Destination wallets',
    name: 'toWalletAddresses',
  },
  {
    label: 'Gas fee (via relayer)',
    name: 'readableRelayerFeeText',
  },
  {
    label: 'RAILGUN fees',
    name: 'readableFeeText',
  },
  {
    label: 'Gas fee',
    name: 'readableGasFee',
  },
  {
    label: 'Private memo',
    name: 'memoText',
  },
  {
    label: 'Contract address',
    name: 'spender',
  },
  {
    label: 'Contract',
    name: 'spenderName',
  },
  {
    label: 'Nonce',
    name: 'nonceText',
  },
  {
    label: 'Slippage value confirmed',
    name: 'confirmedSwapValueText',
  },
  {
    label: 'RAILGUN synced history version',
    name: 'syncedHistoryVersionText',
  },
];
