import {
  calculateGasPrice,
  TransactionGasDetails,
} from '@railgun-community/shared-models';

export const getOverallBatchMinGasPrice = (
  isRelayerTransaction: boolean,
  transactionGasDetails: TransactionGasDetails,
): Optional<bigint> => {
  if (!isRelayerTransaction) {
    return undefined;
  }
  return calculateGasPrice(transactionGasDetails);
};
