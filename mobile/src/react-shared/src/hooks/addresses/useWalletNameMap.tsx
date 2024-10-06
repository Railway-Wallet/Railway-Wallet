import { isDefined } from "@railgun-community/shared-models";
import { useCallback, useMemo } from "react";
import { ERC20AmountRecipientGroup } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { findKnownWalletName } from "../../utils/address";
import { railgunContractName } from "../../utils/networks";
import { useReduxSelector } from "../hooks-redux";

export type WalletNameMap = { [address: string]: string };

export const useWalletNameMap = (
  erc20AmountRecipientGroups: ERC20AmountRecipientGroup[],
  transactionType: TransactionType,
  isFullyPrivateTransaction: boolean
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { savedAddresses } = useReduxSelector("savedAddresses");

  const getWalletName = useCallback(
    (
      isRailgunWallet: boolean,
      recipientAddress: string,
      externalUnresolvedToWalletAddress?: string
    ) => {
      const knownWalletName = findKnownWalletName(
        recipientAddress,
        wallets.available,
        wallets.viewOnly,
        savedAddresses.current
      );
      if (isDefined(knownWalletName)) {
        return knownWalletName;
      }
      if (isDefined(externalUnresolvedToWalletAddress)) {
        return externalUnresolvedToWalletAddress;
      }
      if (isRailgunWallet) {
        return "RAILGUN Wallet";
      }
      if (transactionType === TransactionType.ApproveShield) {
        return railgunContractName(network.current.publicName);
      }

      return `${network.current.publicName} Wallet`;
    },
    [
      network,
      savedAddresses,
      transactionType,
      wallets.available,
      wallets.viewOnly,
    ]
  );

  const walletNameMap: WalletNameMap = useMemo(() => {
    const map: WalletNameMap = {};
    erc20AmountRecipientGroups.forEach((erc20AmountRecipientGroup) => {
      const walletName = getWalletName(
        isFullyPrivateTransaction,
        erc20AmountRecipientGroup.recipientAddress,
        erc20AmountRecipientGroup.externalUnresolvedToWalletAddress
      );
      map[erc20AmountRecipientGroup.recipientAddress] = walletName;
    });
    return map;
  }, [erc20AmountRecipientGroups, getWalletName, isFullyPrivateTransaction]);

  return { walletNameMap, getWalletName };
};
