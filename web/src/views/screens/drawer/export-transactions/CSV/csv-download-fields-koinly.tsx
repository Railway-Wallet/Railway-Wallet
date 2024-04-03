import { KoinlyTransaction } from '@react-shared';
import { DownloadField } from '@services/util/csv-downloader';

export const koinlyFields: DownloadField<KoinlyTransaction>[] = [
  {
    label: 'Tx Hash',
    name: 'hash',
  },
  {
    label: 'Timestamp',
    name: 'utcDate',
  },
  {
    label: 'Sent Amount',
    name: 'sentAmount',
  },
  {
    label: 'Sent Currency',
    name: 'sentCurrency',
  },
  {
    label: 'Received Amount',
    name: 'receivedAmount',
  },
  {
    label: 'Received Currency',
    name: 'receivedCurrency',
  },
  {
    label: 'Fee Amount',
    name: 'feeAmount',
  },
  {
    label: 'Fee Currency',
    name: 'feeCurrency',
  },
  {
    label: 'Label',
    name: 'label',
  },
  {
    label: 'Description',
    name: 'description',
  },
  {
    label: 'Network',
    name: 'network',
  },
];
