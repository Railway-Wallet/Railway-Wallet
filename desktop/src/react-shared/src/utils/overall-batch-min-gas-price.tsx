import {
  calculateGasPrice,
  TransactionGasDetails,
} from '@railgun-community/shared-models';

export const getOverallBatchMinGasPrice = (
  isBroadcasterTransaction: boolean,
  transactionGasDetails: TransactionGasDetails,
  is7702 = false,
): Optional<bigint> => {
  if (is7702) {
    return 0n;
  }
  if (!isBroadcasterTransaction) {
    return undefined;
  }
  return calculateGasPrice(transactionGasDetails);
};
