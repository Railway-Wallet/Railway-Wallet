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

export const createERC20Approval = async (
  networkName: NetworkName,
  spender: string,
  tokenAmount: ERC20Amount
): Promise<ContractTransaction> => {
  const provider = await ProviderService.getProvider(networkName);
  const erc20 = erc20Contract(tokenAmount.token.address, provider);
  return erc20.approve.populateTransaction(
    spender,
    BigInt(tokenAmount.amountString)
  );
};

export const getERC20ApprovalGasEstimate = async (
  networkName: NetworkName,
  spender: string,
  fromWalletAddress: string,
  tokenAmount: ERC20Amount
): Promise<bigint> => {
  const erc20Approval = await createERC20Approval(
    networkName,
    spender,
    tokenAmount
  );
  return getGasEstimate(networkName, erc20Approval, fromWalletAddress);
};

export const executeERC20Approval = async (
  pKey: string,
  networkName: NetworkName,
  spender: string,
  tokenAmount: ERC20Amount,
  gasDetails?: TransactionGasDetails,
  customNonce?: number,
  overrideGasLimitForCancel?: bigint
): Promise<TransactionResponse> => {
  const erc20Approval = await createERC20Approval(
    networkName,
    spender,
    tokenAmount
  );
  return executeTransaction(
    pKey,
    networkName,
    erc20Approval,
    gasDetails,
    customNonce,
    overrideGasLimitForCancel
  );
};
