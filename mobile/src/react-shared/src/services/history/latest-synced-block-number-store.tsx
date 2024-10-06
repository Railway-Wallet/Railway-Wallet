import { isDefined } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import { logDevError } from "../../utils/logging";
import { StorageService } from "../storage/storage-service";

const KEY = SharedConstants.LATEST_SYNCED_BLOCK_NUMBER;

export class LatestSyncedBlockNumberStore {
  static getBlockNumber = async (): Promise<Optional<number>> => {
    try {
      const blockNumberString = await StorageService.getItem(KEY);
      if (isDefined(blockNumberString)) {
        return Number(blockNumberString);
      }
      return undefined;
    } catch (err) {
      logDevError(err);
      return undefined;
    }
  };

  static store = async (blockNumber: number): Promise<void> => {
    await StorageService.setItem(KEY, blockNumber.toString());
  };

  static clear = async (): Promise<void> => {
    await StorageService.removeItem(KEY);
  };
}
