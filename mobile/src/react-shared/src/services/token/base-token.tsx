import { NetworkName, sanitizeError } from "@railgun-community/shared-models";
import { logDevError } from "../../utils/logging";
import { ProviderService } from "../providers/provider-service";

export const getWalletBaseTokenBalance = async (
  networkName: NetworkName,
  address: string
): Promise<bigint> => {
  try {
    const provider = await ProviderService.getProvider(networkName);
    const balance = await provider.getBalance(address);
    return balance;
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    logDevError(err);
    throw sanitizeError(err);
  }
};
