import {
  calculateGasLimit,
  EVMGasType,
  isDefined,
  Network,
  NetworkName,
  sanitizeError,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { ContractTransaction, TransactionResponse, Wallet } from "ethers";
import { minBigInt } from "../../utils/big-numbers";
import { hasBlockedAddress } from "../../utils/blocked-address";
import { logDev, logDevError } from "../../utils/logging";
import { stringifySafe } from "../../utils/stringify";
import { NonPayableOverrides } from "../contract/typechain/common";
import { ProviderService } from "../providers/provider-service";
import { NonceStorageService } from "../wallet/nonce-storage-service";

const setTransactionOptions = (
  transaction: ContractTransaction,
  gasDetails?: TransactionGasDetails,
  customNonce?: number,
  overrideGasLimitForCancel?: bigint
): NonPayableOverrides => {
  if (gasDetails) {
    transaction.gasLimit =
      overrideGasLimitForCancel ?? calculateGasLimit(gasDetails.gasEstimate);

    transaction.type = gasDetails.evmGasType;

    switch (gasDetails.evmGasType) {
      case EVMGasType.Type0:
      case EVMGasType.Type1: {
        transaction.gasPrice = gasDetails.gasPrice;
        break;
      }
      case EVMGasType.Type2: {
        transaction.maxFeePerGas = gasDetails.maxFeePerGas;
        transaction.maxPriorityFeePerGas = gasDetails.maxPriorityFeePerGas;
        break;
      }
    }
  }
  if (isDefined(customNonce)) {
    transaction.nonce = customNonce;
  }
  return transaction;
};

export const executeTransaction = async (
  pKey: string,
  networkName: NetworkName,
  transaction: ContractTransaction,
  gasDetails?: TransactionGasDetails,
  customNonce?: number,
  overrideGasLimitForCancel?: bigint
): Promise<TransactionResponse> => {
  try {
    const provider = await ProviderService.getProvider(networkName);
    const wallet = new Wallet(pKey, provider);

    setTransactionOptions(
      transaction,
      gasDetails,
      customNonce,
      overrideGasLimitForCancel
    );

    if (
      isDefined(transaction.maxPriorityFeePerGas) &&
      isDefined(transaction.maxFeePerGas)
    ) {
      transaction.maxPriorityFeePerGas = minBigInt(
        BigInt(transaction.maxPriorityFeePerGas),
        BigInt(transaction.maxFeePerGas)
      );
    }
    logDev(
      "Submit (any) public tx",
      `wallet ${wallet.address}`,
      `nonce ${transaction.nonce ?? "auto"}`,
      `details ${stringifySafe(transaction)}`
    );

    const fromOrToBlocked = await hasBlockedAddress([
      transaction.from,
      transaction.to,
    ]);
    if (fromOrToBlocked) {
      throw new Error("Blocked address.");
    }

    const txResponse = await wallet.sendTransaction(transaction);

    const nonceStorageService = new NonceStorageService();
    await nonceStorageService.storeLastTransactionNonce(
      wallet.address,
      networkName,
      txResponse.nonce
    );
    return txResponse;
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    logDevError(err);
    throw sanitizeError(err);
  }
};

export const executeWithoutBroadcaster = async (
  fromWalletAddress: string,
  pKey: string,
  transaction: ContractTransaction,
  network: Network,
  customNonce: Optional<number>
): Promise<TransactionResponse> => {
  const provider = await ProviderService.getProvider(network.name);
  const nonceStorageService = new NonceStorageService();
  const nonce = await nonceStorageService.getNextTransactionNonce(
    provider,
    fromWalletAddress,
    network.name,
    customNonce
  );

  transaction.nonce = nonce;
  transaction.from = fromWalletAddress;

  const txResponse = await executeTransaction(pKey, network.name, transaction);
  return txResponse;
};
