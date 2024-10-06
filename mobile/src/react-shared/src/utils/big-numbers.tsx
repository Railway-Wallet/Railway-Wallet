export const maxBigInt = (b1: bigint, b2: bigint): bigint => {
  return b1 > b2 ? b1 : b2;
};

export const minBigInt = (b1: bigint, b2: bigint): bigint => {
  return b1 < b2 ? b1 : b2;
};

export const getMedianBigInt = (feeHistoryOutputs: bigint[]): bigint => {
  const length = feeHistoryOutputs.length;
  if (length === 0) {
    throw new Error("No fee history outputs");
  }
  const sorted = feeHistoryOutputs.sort((a, b) => {
    return a - b < 0 ? -1 : 1;
  });
  const middleIndex = Math.ceil(length / 2 - 1);
  return sorted[middleIndex];
};
