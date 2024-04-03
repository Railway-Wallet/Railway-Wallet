import { isDefined } from '@railgun-community/shared-models';
import { SharedConstants } from '../../config';
import {
  BlockedRelayer,
  setBlockedRelayers,
} from '../../redux-store/reducers/relayer-blocklist-reducer';
import { AppDispatch } from '../../redux-store/store';
import { logDev } from '../../utils/logging';
import { StorageService } from '../storage';

export class BlockedRelayerService {
  private dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  private async fetchStoredBlockedRelayers(): Promise<BlockedRelayer[]> {
    try {
      const storedJsonValue = await StorageService.getItem(
        SharedConstants.BLOCKED_RELAYERS,
      );
      if (isDefined(storedJsonValue)) {
        const relayers = JSON.parse(storedJsonValue) as BlockedRelayer[];
        return BlockedRelayerService.sortBlockedRelayers(relayers);
      }

      return [];
    } catch (cause) {
      logDev('Error fetching blocked relayers:', cause);
      throw new Error('Error fetching blocked relayers.', { cause });
    }
  }

  private async storeBlockedRelayers(relayers: BlockedRelayer[]) {
    await StorageService.setItem(
      SharedConstants.BLOCKED_RELAYERS,
      JSON.stringify(relayers),
    );
  }

  async loadBlockedRelayersFromStorage() {
    const blockedRelayers = await this.fetchStoredBlockedRelayers();

    this.dispatch(setBlockedRelayers(blockedRelayers));
  }

  async addBlockedRelayer(
    railgunAddress: string,
    expiration: Optional<number>,
  ) {
    const blockedRelayer: BlockedRelayer = {
      railgunAddress,
      blockedTimestamp: Math.round(Date.now() / 1000),
      expiration,
    };

    const blockedRelayers = await this.fetchStoredBlockedRelayers();

    for (const blockedRelayer of blockedRelayers) {
      if (
        blockedRelayer.railgunAddress.toLowerCase() ===
        railgunAddress.toLowerCase()
      ) {
        throw new Error('You have already blocked this relayer.');
      }
    }

    blockedRelayers.unshift(blockedRelayer);

    await this.storeBlockedRelayers(blockedRelayers);
    this.dispatch(setBlockedRelayers(blockedRelayers));
  }

  async removeBlockedRelayer(railgunAddress: string) {
    const blockedRelayers = await this.fetchStoredBlockedRelayers();

    const updatedBlockedRelayers = blockedRelayers.filter(
      relayer => relayer.railgunAddress !== railgunAddress,
    );

    await this.storeBlockedRelayers(updatedBlockedRelayers);
    this.dispatch(setBlockedRelayers(updatedBlockedRelayers));
  }

  static sortBlockedRelayers(relayers: BlockedRelayer[]): BlockedRelayer[] {
    return relayers.sort((a, b) => {
      return a.blockedTimestamp > b.blockedTimestamp ? -1 : 0;
    });
  }

  static isRelayerBlocked(
    railgunAddress: Optional<string>,
    blockedRelayers: BlockedRelayer[],
  ) {
    return !blockedRelayers.every(r => r.railgunAddress !== railgunAddress);
  }
}
