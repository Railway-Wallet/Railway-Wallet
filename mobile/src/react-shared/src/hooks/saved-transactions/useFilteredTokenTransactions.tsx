import { isDefined, NETWORK_CONFIG } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { ERC20Token } from "../../models/token";
import { SavedTransaction, TransactionAction } from "../../models/transaction";
import {
  isPrivateTx,
  transactionIncludesAnyWalletAddress,
} from "../../utils/saved-transactions";
import {
  compareTokens,
  isWrappedBaseTokenForNetwork,
} from "../../utils/tokens";
import { useReduxSelector } from "../hooks-redux";

export const useFilteredTokenTransactions = (
  token: ERC20Token,
  isRailgun: boolean
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { savedTransactions } = useReduxSelector("savedTransactions");

  const tokenTransactions: SavedTransaction[] = useMemo(() => {
    const txs = savedTransactions.forNetwork[network.current.name] ?? [];
    const filteredTxs = txs.filter((tx) => {
      const foundInTxTokenList =
        compareTokens(token, tx.swapSellTokenAmount?.token) ||
        compareTokens(token, tx.swapBuyTokenAmount?.token) ||
        isDefined(
          tx.tokenAmounts.find((ta) => compareTokens(ta.token, token))
        ) ||
        (isDefined(tx.syncedReceiveTokenAmounts) &&
          isDefined(
            tx.syncedReceiveTokenAmounts.find((ta) =>
              compareTokens(ta.token, token)
            )
          )) ||
        (isDefined(tx.broadcasterFeeTokenAmount) &&
          compareTokens(tx.broadcasterFeeTokenAmount.token, token));

      const showBaseTokenShield =
        (token.isBaseToken ?? false) &&
        (tx.isBaseTokenDepositWithdraw ?? false) &&
        tx.action === TransactionAction.shield &&
        !isRailgun;

      const showBaseTokenUnshield =
        isWrappedBaseTokenForNetwork(token, NETWORK_CONFIG[tx.network]) &&
        (tx.isBaseTokenDepositWithdraw ?? false) &&
        tx.action === TransactionAction.unshield &&
        isRailgun;

      const txMatchesToken =
        foundInTxTokenList || showBaseTokenShield || showBaseTokenUnshield;

      let swapTypeMatchesIfNeeded = true;
      if (tx.action === TransactionAction.swap) {
        swapTypeMatchesIfNeeded = isRailgun === isPrivateTx(tx);
      }

      return (
        txMatchesToken &&
        swapTypeMatchesIfNeeded &&
        transactionIncludesAnyWalletAddress(tx, wallets.active)
      );
    });
    return filteredTxs;
  }, [wallets.active, network, savedTransactions.forNetwork, token, isRailgun]);

  return { tokenTransactions };
};
