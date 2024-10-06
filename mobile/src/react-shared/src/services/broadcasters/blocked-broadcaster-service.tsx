import { isDefined } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config";
import {
  BlockedBroadcaster,
  setBlockedBroadcasters,
} from "../../redux-store/reducers/broadcaster-blocklist-reducer";
import { AppDispatch } from "../../redux-store/store";
import { logDev } from "../../utils/logging";
import { StorageService } from "../storage";

export class BlockedBroadcasterService {
  private dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  private async fetchStoredBlockedBroadcasters(): Promise<
    BlockedBroadcaster[]
  > {
    try {
      const storedJsonValue = await StorageService.getItem(
        SharedConstants.BLOCKED_BROADCASTERS
      );
      if (isDefined(storedJsonValue)) {
        const broadcasters = JSON.parse(
          storedJsonValue
        ) as BlockedBroadcaster[];
        return BlockedBroadcasterService.sortBlockedBroadcasters(broadcasters);
      }

      return [];
    } catch (cause) {
      logDev("Error fetching blocked broadcasters:", cause);
      throw new Error("Error fetching blocked broadcasters.", { cause });
    }
  }

  private async storeBlockedBroadcasters(broadcasters: BlockedBroadcaster[]) {
    await StorageService.setItem(
      SharedConstants.BLOCKED_BROADCASTERS,
      JSON.stringify(broadcasters)
    );
  }

  async loadBlockedBroadcastersFromStorage() {
    const blockedBroadcasters = await this.fetchStoredBlockedBroadcasters();

    this.dispatch(setBlockedBroadcasters(blockedBroadcasters));
  }

  async addBlockedBroadcaster(
    railgunAddress: string,
    expiration: Optional<number>
  ) {
    const blockedBroadcaster: BlockedBroadcaster = {
      railgunAddress,
      blockedTimestamp: Math.round(Date.now() / 1000),
      expiration,
    };

    const blockedBroadcasters = await this.fetchStoredBlockedBroadcasters();

    for (const blockedBroadcaster of blockedBroadcasters) {
      if (
        blockedBroadcaster.railgunAddress.toLowerCase() ===
        railgunAddress.toLowerCase()
      ) {
        throw new Error("You have already blocked this broadcaster.");
      }
    }

    blockedBroadcasters.unshift(blockedBroadcaster);

    await this.storeBlockedBroadcasters(blockedBroadcasters);
    this.dispatch(setBlockedBroadcasters(blockedBroadcasters));
  }

  async removeBlockedBroadcaster(railgunAddress: string) {
    const blockedBroadcasters = await this.fetchStoredBlockedBroadcasters();

    const updatedBlockedBroadcasters = blockedBroadcasters.filter(
      (broadcaster) => broadcaster.railgunAddress !== railgunAddress
    );

    await this.storeBlockedBroadcasters(updatedBlockedBroadcasters);
    this.dispatch(setBlockedBroadcasters(updatedBlockedBroadcasters));
  }

  static sortBlockedBroadcasters(
    broadcasters: BlockedBroadcaster[]
  ): BlockedBroadcaster[] {
    return broadcasters.sort((a, b) => {
      return a.blockedTimestamp > b.blockedTimestamp ? -1 : 0;
    });
  }

  static isBroadcasterBlocked(
    railgunAddress: Optional<string>,
    blockedBroadcasters: BlockedBroadcaster[]
  ) {
    return !blockedBroadcasters.every(
      (r) => r.railgunAddress !== railgunAddress
    );
  }
}
