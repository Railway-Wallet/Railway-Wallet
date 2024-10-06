import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import { logDevError } from "../../utils/logging";
import { StorageService } from "../storage/storage-service";

export class ERC20TokenDecimalsCache {
  private static getStorageKey = (
    networkName: NetworkName,
    tokenAddress: string
  ) => {
    return `${SharedConstants.ERC20_DECIMALS}|${networkName}|${tokenAddress}`;
  };

  static getCached = async (
    networkName: NetworkName,
    tokenAddress: string
  ): Promise<Optional<bigint>> => {
    try {
      const storedDecimals = await StorageService.getItem(
        this.getStorageKey(networkName, tokenAddress)
      );
      if (isDefined(storedDecimals)) {
        return BigInt(storedDecimals);
      }
      return undefined;
    } catch (err) {
      logDevError(err);
      return undefined;
    }
  };

  static store = async (
    networkName: NetworkName,
    tokenAddress: string,
    decimals: bigint
  ): Promise<void> => {
    await StorageService.setItem(
      this.getStorageKey(networkName, tokenAddress),
      decimals.toString()
    );
  };

  static clear = async (
    networkName: NetworkName,
    tokenAddress: string
  ): Promise<void> => {
    await StorageService.removeItem(
      this.getStorageKey(networkName, tokenAddress)
    );
  };
}
