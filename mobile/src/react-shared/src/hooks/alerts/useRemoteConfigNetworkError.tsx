import { NetworkName } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { TransactionType } from "../../models/transaction";
import { useReduxSelector } from "../hooks-redux";

export const useRemoteConfigNetworkError = (
  transactionType: TransactionType,
  isPrivate: boolean,
  useRelayAdapt: boolean
) => {
  const { network } = useReduxSelector("network");
  const { remoteConfig } = useReduxSelector("remoteConfig");

  const remoteConfigNetworkError = useMemo((): Optional<Error> => {
    const networkConfig =
      remoteConfig.current?.availableNetworks[network.current.name];
    if (!networkConfig) {
      return new Error(
        `Network is not available for ${transactionType} transactions. Please try again later.`
      );
    }
    const { publicName } = network.current;

    if (useRelayAdapt && !networkConfig.canRelayAdapt) {
      return new Error(
        `Relay Adapt transactions (ie. cross-contract calls) are not available on ${publicName} at the moment. Please try again later.`
      );
    }

    switch (transactionType) {
      case TransactionType.ApproveShield:
      case TransactionType.Shield:
        if (!networkConfig.canShield) {
          return new Error(
            `Shielding is not available on ${publicName} at the moment. Please try again later.`
          );
        }
        break;
      case TransactionType.Unshield:
        if (!networkConfig.canUnshield) {
          return new Error(
            `Unshielding is not available on ${publicName} at the moment. Please try again later.`
          );
        }
        break;
      case TransactionType.Send:
        if (isPrivate && !networkConfig.canSendShielded) {
          return new Error(
            `Shielded transfers are not available on ${publicName} at the moment. Please try again later.`
          );
        } else if (!isPrivate && !networkConfig.canSendPublic) {
          return new Error(
            `Public transfers are not available on ${publicName} at the moment. Please try again later.`
          );
        }
        break;
      case TransactionType.Swap:
        if (isPrivate && !networkConfig.canSwapShielded) {
          return new Error(
            `Shielded swaps are not available on ${publicName} at the moment. Please try again later.`
          );
        } else if (!isPrivate && !networkConfig.canSwapPublic) {
          return new Error(
            `Public swaps are not available on ${publicName} at the moment. Please try again later.`
          );
        }
        break;
      case TransactionType.Mint:
        if (network.current.name !== NetworkName.EthereumRopsten_DEPRECATED) {
          return new Error(
            "Minting for test tokens is only available on the Ropsten testnet."
          );
        }
        break;
      case TransactionType.Cancel:
      case TransactionType.ApproveSpender:
      case TransactionType.AddLiquidity:
      case TransactionType.RemoveLiquidity:
      case TransactionType.FarmDeposit:
      case TransactionType.FarmRedeem:
        break;
    }
    return undefined;
  }, [remoteConfig, network, useRelayAdapt, transactionType, isPrivate]);

  return {
    remoteConfigNetworkError,
  };
};
