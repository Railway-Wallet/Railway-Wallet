import { ReactConfig } from '@react-shared';

export enum ExportType {
  Koinly = 'koinly',
  HumanReadable = 'human-readable',
}

export type ExportOption = {
  value: ExportType;
  label: string;
};

export const getTransactionExportOptions = (
  showKoinlyExport: boolean,
): ExportOption[] => {
  const options = [
    { value: ExportType.HumanReadable, label: 'Human-Readable Log' },
  ];

  if (showKoinlyExport && ReactConfig.IS_DEV) {
    options.unshift({ value: ExportType.Koinly, label: 'Koinly Tax Software' });
  }

  return options;
};

export type YearOption = {
  value: string;
  label: string;
};

export const allYearsOption: YearOption = {
  label: 'All time',
  value: 'All',
};

const getYearOptions = (includeCurrentYear: boolean = false) => {
  const currentYear = new Date().getFullYear();
  const yearsArray = [];

  for (
    let year = 2021;
    includeCurrentYear ? year <= currentYear : year < currentYear;
    year++
  ) {
    yearsArray.push(year.toString());
  }

  return [
    allYearsOption,
    ...yearsArray.map(year => ({ label: year, value: year })),
  ];
};

export const getUTCString = () => {
  const utcString = new Date().toUTCString().substring(5, 16).replace(' ', '');
  return utcString;
};

export const getScreenDataFromExportType = (exportType: ExportType) => {
  switch (exportType) {
    case ExportType.Koinly:
      return {
        yearsOptions: getYearOptions(),
        yearSelectorTitle: 'Select tax year',
        description:
          'This action will export a list of your private transactions for the current network and wallet. Please note that public transactions are ignored, and you should connect your public wallet to Koinly directly.\n\nYour export will include Shields, Unshields, Private Transfers, and Private DeFi interactions.',
      };
    case ExportType.HumanReadable:
      return {
        yearsOptions: getYearOptions(true),
        yearSelectorTitle: 'Select year',
        description:
          'This action will export a list of your Activity History, which includes all private transactions for the current network and wallet at a minimum. The export will also include any public transactions submitted by this device. Please note that other devices may export a slightly different list of public transactions for the same wallet.',
      };
  }
};
