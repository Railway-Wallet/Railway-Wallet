import {
  calculateGasPrice,
  TransactionGasDetails,
} from "@railgun-community/shared-models";

export const getOverallBatchMinGasPrice = (
  isBroadcasterTransaction: boolean,
  transactionGasDetails: TransactionGasDetails
): Optional<bigint> => {
  if (!isBroadcasterTransaction) {
    return undefined;
  }
  return calculateGasPrice(transactionGasDetails);
};
