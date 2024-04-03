import { DownloadableFileExtension } from '@models/file-extensions';

export const downloadFile = (
  file: Blob | string,
  fileName: string,
  fileExtension: DownloadableFileExtension,
) => {
  const element = document.createElement('a');
  if (typeof file === 'string') {
    element.href = file;
  } else {
    element.href = URL.createObjectURL(file);
  }
  element.download = `${fileName}${fileExtension}`;
  document.body.appendChild(element);
  element.click();
};
