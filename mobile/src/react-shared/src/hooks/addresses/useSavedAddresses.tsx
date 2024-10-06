import { isDefined } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { SharedConstants } from "../../config/shared-constants";
import { TransactionType } from "../../models/transaction";
import { WalletAddressType } from "../../models/wallet-type";
import { AppDispatch } from "../../redux-store/store";
import { SavedAddressService } from "../../services/wallet/saved-address-service";
import { shortenWalletAddress } from "../../utils/util";
import { useReduxSelector } from "../hooks-redux";
import { useKnownWalletName } from "./useKnownWalletName";

export const useSavedAddresses = (
  dispatch: AppDispatch,
  walletAddressType: WalletAddressType.Ethereum | WalletAddressType.Railgun,
  hasValidRecipient: boolean,
  address: string,
  transactionType: TransactionType,
  setAddressText: (address: string) => void,
  saveAddressError: (error: Error) => void
) => {
  const { wallets } = useReduxSelector("wallets");
  const { savedAddresses } = useReduxSelector("savedAddresses");

  const availableWalletChoices = wallets.available;
  const availableWalletOptions = useMemo(
    () =>
      availableWalletChoices
        .filter((w) => {
          switch (transactionType) {
            case TransactionType.ApproveShield:
            case TransactionType.ApproveSpender:
            case TransactionType.Cancel:
            case TransactionType.Mint:
            case TransactionType.Shield:
            case TransactionType.Unshield:
            case TransactionType.FarmDeposit:
            case TransactionType.FarmRedeem:
            case TransactionType.AddLiquidity:
            case TransactionType.RemoveLiquidity:
            case TransactionType.Swap:
              return true;
            case TransactionType.Send:
              return !w.isActive;
          }
        })
        .map((w) => {
          let walletAddress: string;
          switch (walletAddressType) {
            case WalletAddressType.Railgun:
              walletAddress = w.railAddress;
              break;
            case WalletAddressType.Ethereum:
              walletAddress = w.ethAddress;
              break;
          }

          return {
            name: `${w.name}: ${shortenWalletAddress(walletAddress)}`,
            action: () => setAddressText(walletAddress),
          };
        }),
    [availableWalletChoices, setAddressText, walletAddressType, transactionType]
  );

  const savedAddressChoicesForWalletType = useMemo(() => {
    switch (walletAddressType) {
      case WalletAddressType.Railgun:
        return savedAddresses.current.filter((w) => isDefined(w.railAddress));
      case WalletAddressType.Ethereum:
        return savedAddresses.current.filter((w) => isDefined(w.ethAddress));
    }
  }, [savedAddresses, walletAddressType]);

  const savedAddressOptionsForWalletType = useMemo(
    () =>
      savedAddressChoicesForWalletType.map((w) => {
        let walletAddress: string;
        switch (walletAddressType) {
          case WalletAddressType.Railgun:
            walletAddress = w.railAddress as string;
            break;
          case WalletAddressType.Ethereum:
            walletAddress = w.ethAddress as string;
            break;
        }
        return {
          name: `${w.name}: ${shortenWalletAddress(walletAddress)}`,
          action: () => setAddressText(walletAddress),
        };
      }),
    [savedAddressChoicesForWalletType, setAddressText, walletAddressType]
  );

  const savedAddressOptionsForExternalResolved = useMemo(
    () =>
      savedAddresses.current
        .filter((w) => isDefined(w.externalResolvedAddress))
        .map((w) => {
          const walletAddress = w.externalResolvedAddress as string;
          return {
            name: `${w.name}: ${walletAddress}`,
            action: () => setAddressText(walletAddress),
          };
        }),
    [savedAddresses, setAddressText]
  );

  const savedAddressOptions = useMemo(() => {
    return [
      ...savedAddressOptionsForWalletType,
      ...savedAddressOptionsForExternalResolved,
    ];
  }, [
    savedAddressOptionsForWalletType,
    savedAddressOptionsForExternalResolved,
  ]);

  const saveWalletAddress = async (
    address: string,
    name: string,
    walletAddressType: WalletAddressType
  ) => {
    if (name.length > SharedConstants.MAX_LENGTH_WALLET_NAME) {
      throw new Error("Address name is too long.");
    }

    let ethAddress, railAddress, externalResolvedAddress;
    switch (walletAddressType) {
      case WalletAddressType.Railgun:
        railAddress = address;
        break;
      case WalletAddressType.Ethereum:
        ethAddress = address;
        break;
      case WalletAddressType.ExternalResolved:
        externalResolvedAddress = address;
        break;
    }
    const savedAddressService = new SavedAddressService(dispatch);
    try {
      await savedAddressService.saveAddress(
        name,
        ethAddress,
        railAddress,
        externalResolvedAddress
      );
    } catch (cause) {
      if (!(cause instanceof Error)) {
        throw new Error("Unexpected non-error thrown", { cause });
      }
      saveAddressError(new Error("Failed to save wallet address", { cause }));
    }
  };

  const { knownWalletName } = useKnownWalletName(address);

  const shouldEnableSaveWallet = useMemo(() => {
    if (!hasValidRecipient) {
      return false;
    }
    return !isDefined(knownWalletName);
  }, [hasValidRecipient, knownWalletName]);

  return {
    saveWalletAddress,
    shouldEnableSaveWallet,
    savedAddressOptions,
    availableWalletOptions,
    knownWalletName,
  };
};
