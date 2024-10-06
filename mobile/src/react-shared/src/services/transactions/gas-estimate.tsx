import { NetworkName, sanitizeError } from "@railgun-community/shared-models";
import { ContractTransaction } from "ethers";
import { logDevError } from "../../utils/logging";
import { ProviderService } from "../providers/provider-service";

export const getGasEstimate = async (
  networkName: NetworkName,
  transaction: ContractTransaction,
  fromWalletAddress: string
): Promise<bigint> => {
  try {
    const provider = await ProviderService.getProvider(networkName);
    transaction.from = fromWalletAddress;
    const gasEstimate = await provider.estimateGas(transaction);
    return gasEstimate;
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    logDevError(err);
    throw sanitizeError(err);
  }
};
