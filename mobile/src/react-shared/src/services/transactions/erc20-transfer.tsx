import {
  NetworkName,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { ContractTransaction, TransactionResponse } from "ethers";
import { ERC20Amount } from "../../models/token";
import { erc20Contract } from "../contract/contract";
import { ProviderService } from "../providers/provider-service";
import { executeTransaction } from "./execute-service";
import { getGasEstimate } from "./gas-estimate";

const createERC20Transfer = async (
  networkName: NetworkName,
  toWalletAddress: string,
  tokenAmount: ERC20Amount
): Promise<ContractTransaction> => {
  const provider = await ProviderService.getProvider(networkName);
  const erc20 = erc20Contract(tokenAmount.token.address, provider);
  return erc20.transfer.populateTransaction(
    toWalletAddress,
    BigInt(tokenAmount.amountString)
  );
};

const createBaseTokenTransfer = (
  toWalletAddress: string,
  tokenAmount: ERC20Amount
): ContractTransaction => {
  return {
    to: toWalletAddress,
    data: "0x",
    value: BigInt(tokenAmount.amountString),
  };
};

export const getERC20TransferGasEstimate = async (
  networkName: NetworkName,
  toWalletAddress: string,
  fromWalletAddress: string,
  tokenAmount: ERC20Amount
): Promise<bigint> => {
  if (tokenAmount.token.isBaseToken ?? false) {
    const baseTokenTransfer = createBaseTokenTransfer(
      toWalletAddress,
      tokenAmount
    );
    return getGasEstimate(networkName, baseTokenTransfer, fromWalletAddress);
  }

  const erc20Transfer = await createERC20Transfer(
    networkName,
    toWalletAddress,
    tokenAmount
  );
  return getGasEstimate(networkName, erc20Transfer, fromWalletAddress);
};

export const executeERC20Transfer = async (
  pKey: string,
  networkName: NetworkName,
  toWalletAddress: string,
  tokenAmount: ERC20Amount,
  gasDetails?: TransactionGasDetails,
  customNonce?: number,
  overrideGasLimitForCancel?: bigint
): Promise<TransactionResponse> => {
  if (tokenAmount.token.isBaseToken ?? false) {
    const baseTokenTransfer = createBaseTokenTransfer(
      toWalletAddress,
      tokenAmount
    );
    return executeTransaction(
      pKey,
      networkName,
      baseTokenTransfer,
      gasDetails,
      customNonce,
      overrideGasLimitForCancel
    );
  }

  const erc20Transfer = await createERC20Transfer(
    networkName,
    toWalletAddress,
    tokenAmount
  );
  return executeTransaction(
    pKey,
    networkName,
    erc20Transfer,
    gasDetails,
    customNonce,
    overrideGasLimitForCancel
  );
};
