import { Authorization, ContractTransaction } from 'ethers';
import { RelayAdapt7702PopulateFields } from '@react-shared';

const GAS_LIMIT_BUFFER_NUMERATOR = 12000n;
const GAS_LIMIT_BUFFER_DENOMINATOR = 10000n;
const unbufferGasEstimate = (bufferedGasLimit: bigint): bigint =>
  (bufferedGasLimit * GAS_LIMIT_BUFFER_DENOMINATOR) / GAS_LIMIT_BUFFER_NUMERATOR;

export const extractRelayAdapt7702Fields = (
  transaction: ContractTransaction,
): RelayAdapt7702PopulateFields => {
  const authorization = (
    transaction as ContractTransaction & {
      authorizationList?: Authorization[];
    }
  ).authorizationList?.[0];
  if (transaction.type !== 4 || !authorization) {
    return {};
  }
  return {
    relayAdapt7702Authorization: {
      address: authorization.address,
      nonce: authorization.nonce,
      chainId: authorization.chainId,
      r: authorization.signature.r,
      s: authorization.signature.s,
      yParity: authorization.signature.yParity,
    },
    type4FeeOverrides: {
      gasLimit: unbufferGasEstimate(transaction.gasLimit ?? 0n),
      maxFeePerGas: transaction.maxFeePerGas ?? 0n,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ?? 0n,
    },
  };
};
