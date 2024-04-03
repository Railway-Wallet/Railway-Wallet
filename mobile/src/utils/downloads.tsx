export const downloadFailed = (statusCode: number) => {
  return statusCode < 200 || statusCode >= 300;
};
