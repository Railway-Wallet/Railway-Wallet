import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { Provider } from "ethers";
import { SharedConstants } from "../../config/shared-constants";
import { logDevError } from "../../utils/logging";
import { StorageService } from "../storage/storage-service";

export class NonceStorageService {
  getNextTransactionNonce = async (
    provider: Provider,
    walletAddress: string,
    networkName: NetworkName,
    customNonce?: number
  ): Promise<number> => {
    if (isDefined(customNonce)) {
      return customNonce;
    }

    const [lastTransactionNonce, transactionCount] = await Promise.all([
      this.getLastTransactionNonce(walletAddress, networkName),
      provider.getTransactionCount(walletAddress, "pending"),
    ]);
    if (isDefined(lastTransactionNonce)) {
      return Math.max(lastTransactionNonce + 1, transactionCount);
    }
    return transactionCount;
  };

  private getStorageKeyLastNonce = (
    walletAddress: string,
    networkName: NetworkName
  ) => {
    return `${SharedConstants.LAST_TRANSACTION_NONCE}|${walletAddress}|${networkName}}`;
  };

  private getLastTransactionNonce = async (
    walletAddress: string,
    networkName: NetworkName
  ): Promise<Optional<number>> => {
    try {
      const lastNonce = await StorageService.getItem(
        this.getStorageKeyLastNonce(walletAddress, networkName)
      );
      if (isDefined(lastNonce)) {
        return parseInt(lastNonce, 10);
      }
      return undefined;
    } catch (err) {
      logDevError(err);
      return undefined;
    }
  };

  storeLastTransactionNonce = async (
    walletAddress: string,
    networkName: NetworkName,
    nonce: number
  ): Promise<void> => {
    await StorageService.setItem(
      this.getStorageKeyLastNonce(walletAddress, networkName),
      nonce.toString()
    );
  };

  clearLastTransactionNonce = async (
    walletAddress: string,
    networkName: NetworkName
  ): Promise<void> => {
    await StorageService.removeItem(
      this.getStorageKeyLastNonce(walletAddress, networkName)
    );
  };
}
