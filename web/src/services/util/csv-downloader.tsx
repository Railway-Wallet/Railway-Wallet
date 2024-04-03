import { isDefined } from '@railgun-community/shared-models';
import { DownloadableFileExtension } from '@models/file-extensions';
import { downloadFile } from '@utils/download-file';

export type DownloadField<T> = {
  name: keyof T;
  label: string;
};

type CSVRow = string[];

const sanitizeCSVText = (text?: string) => {
  if (!isDefined(text)) {
    return '';
  }
  return text;
};

export const createCSVRows = <T,>(
  fields: DownloadField<T>[],
  items: T[],
): CSVRow[] => {
  const labelRow: CSVRow = fields.map(field => field.label);

  const itemRows: CSVRow[] = items.map(item => {
    return fields.map(({ name }) => {
      const value = (item as T)[name];
      return sanitizeCSVText(value as string);
    });
  });

  return [labelRow, ...itemRows];
};

export const downloadCSV = <T,>(
  fields: DownloadField<T>[],
  items: T[],
  name: string,
) => {
  const rows = createCSVRows(fields, items);

  let csvContent = '';
  rows.forEach(row => {
    let content = row.join(';');
    csvContent += content + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, name, DownloadableFileExtension.CSV);
};
