import {
  calculateTotalGas,
  isDefined,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { useMemo } from "react";
import { BASE_TOKEN_ADDRESS } from "../../models/token";
import { useReduxSelector } from "../hooks-redux";

export const useGasTokenBalanceError = (
  requiresProofGeneration: boolean,
  gasDetails?: TransactionGasDetails
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");

  const currentWallet = wallets.active;

  const networkBalances = erc20BalancesNetwork.forNetwork[network.current.name];

  const currentBaseTokenBalanceString =
    isDefined(currentWallet) &&
    isDefined(networkBalances) &&
    isDefined(networkBalances.forWallet[currentWallet.id])
      ? networkBalances.forWallet[currentWallet.id]?.[BASE_TOKEN_ADDRESS]
      : undefined;

  const gasTokenBalanceError = useMemo((): Optional<Error> => {
    if (requiresProofGeneration) {
      return undefined;
    }
    if (!gasDetails) {
      return undefined;
    }
    if (
      !isDefined(currentBaseTokenBalanceString) ||
      currentBaseTokenBalanceString === ""
    ) {
      return new Error(
        `No balance found for ${network.current.baseToken.symbol}.`
      );
    }
    const currentBaseTokenBalance = BigInt(currentBaseTokenBalanceString);
    const totalGas = calculateTotalGas(gasDetails);
    if (totalGas > currentBaseTokenBalance) {
      return new Error(
        `You do not have enough ${network.current.baseToken.symbol} for this transaction.`
      );
    }
    return undefined;
  }, [
    requiresProofGeneration,
    gasDetails,
    currentBaseTokenBalanceString,
    network,
  ]);

  return {
    gasTokenBalanceError,
  };
};
