import { SharedConstants } from "../../config/shared-constants";
import { SavedAddress } from "../../models/wallet";
import { setSavedAddresses } from "../../redux-store/reducers/saved-addresses-reducer";
import { AppDispatch } from "../../redux-store/store";
import { StorageService } from "../storage/storage-service";

export class SavedAddressService {
  dispatch: AppDispatch;

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch;
  }

  async delete(savedAddress: SavedAddress) {
    const savedAddresses = await this.getSavedAddresses();
    const filteredSavedAddresses = savedAddresses.filter(
      (a) => !this.compareSavedAddress(a, savedAddress)
    );
    await this.storeSavedAddresses(filteredSavedAddresses);
  }

  private compareSavedAddress(a: SavedAddress, b: SavedAddress) {
    return (
      a.ethAddress === b.ethAddress &&
      a.railAddress === b.railAddress &&
      a.externalResolvedAddress === b.externalResolvedAddress
    );
  }

  async saveAddress(
    name: string,
    ethAddress?: string,
    railAddress?: string,
    externalResolvedAddress?: string
  ): Promise<void> {
    const newSavedAddress: SavedAddress = {
      name,
      ethAddress,
      railAddress,
      externalResolvedAddress,
    };
    const savedAddresses = await this.getSavedAddresses();
    for (const savedAddress of savedAddresses) {
      if (this.compareSavedAddress(savedAddress, newSavedAddress)) {
        throw new Error(
          `You have already saved this address under name "${savedAddress.name}"`
        );
      }
      if (
        savedAddress.name.toLowerCase() === newSavedAddress.name.toLowerCase()
      ) {
        throw new Error(
          `You already have a wallet with name "${savedAddress.name}"`
        );
      }
    }
    await this.storeSavedAddresses([...savedAddresses, newSavedAddress]);
  }

  async getSavedAddresses(): Promise<SavedAddress[]> {
    const stored = await StorageService.getItem(
      SharedConstants.SAVED_ADDRESSES
    );
    if (stored == null) {
      return [];
    }
    return JSON.parse(stored);
  }

  async storeSavedAddresses(savedAddresses: SavedAddress[]): Promise<void> {
    await StorageService.setItem(
      SharedConstants.SAVED_ADDRESSES,
      JSON.stringify(savedAddresses)
    );
    this.dispatch(setSavedAddresses(savedAddresses));
  }

  async refreshSavedAddressesFromStorage() {
    const savedAddresses = await this.getSavedAddresses();
    this.dispatch(setSavedAddresses(savedAddresses));
  }
}
