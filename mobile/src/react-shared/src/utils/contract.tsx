import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { isAddress } from "ethers";
import { ProviderService } from "../services/providers/provider-service";

export const isSmartContract = async (
  networkName: NetworkName,
  address: string
) => {
  try {
    const provider = await ProviderService.getProvider(networkName);
    const code = await provider.getCode(address);
    return isDefined(code) && code !== "" && code !== "0x";
  } catch (e) {
    return false;
  }
};

export const validateERC20TokenContract = async (
  networkName: NetworkName,
  tokenAddress: string
): Promise<boolean> => {
  if (!isAddress(tokenAddress)) {
    return false;
  }
  const isContract = await isSmartContract(networkName, tokenAddress);
  if (!isContract) {
    return false;
  }
  return true;
};
