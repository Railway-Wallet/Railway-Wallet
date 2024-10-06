import {
  NetworkName,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { ContractTransaction, TransactionResponse } from "ethers";
import { ERC20Amount } from "../../models/token";
import { mintableTestERC20Contract } from "../contract";
import { ProviderService } from "../providers/provider-service";
import { executeTransaction } from "./execute-service";
import { getGasEstimate } from "./gas-estimate";

const createERC20Mint = async (
  networkName: NetworkName,
  toWalletAddress: string,
  tokenAmount: ERC20Amount
): Promise<ContractTransaction> => {
  const provider = await ProviderService.getProvider(networkName);

  const mintableERC20 = mintableTestERC20Contract(
    tokenAmount.token.address,
    provider
  );

  return mintableERC20.mint.populateTransaction(
    toWalletAddress,
    BigInt(tokenAmount.amountString)
  );
};

export const getERC20MintGasEstimate = async (
  networkName: NetworkName,
  toWalletAddress: string,
  fromWalletAddress: string,
  tokenAmount: ERC20Amount
): Promise<bigint> => {
  const erc20Mint = await createERC20Mint(
    networkName,
    toWalletAddress,
    tokenAmount
  );
  const gasEstimate = await getGasEstimate(
    networkName,
    erc20Mint,
    fromWalletAddress
  );
  return gasEstimate;
};

export const executeERC20Mint = async (
  pKey: string,
  networkName: NetworkName,
  toWalletAddress: string,
  tokenAmount: ERC20Amount,
  gasDetails?: TransactionGasDetails,
  customNonce?: number,
  overrideGasLimitForCancel?: bigint
): Promise<TransactionResponse> => {
  const erc20Mint = await createERC20Mint(
    networkName,
    toWalletAddress,
    tokenAmount
  );
  const txResponse = await executeTransaction(
    pKey,
    networkName,
    erc20Mint,
    gasDetails,
    customNonce,
    overrideGasLimitForCancel
  );
  return txResponse;
};
