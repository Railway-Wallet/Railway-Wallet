import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import { useCallback, useMemo } from "react";
import { ERC20Amount, ERC20Token } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { AppSettingsService } from "../../services/settings/app-settings-service";
import {
  getBaseTokenForNetwork,
  getTopTokenForWallet,
  getWrappedTokenForNetwork,
} from "../../services/wallet/wallet-balance-service";
import { compareTokens, tokenFoundInList } from "../../utils/tokens";
import { useReduxSelector } from "../hooks-redux";

export const useTopPickERC20 = (
  transactionType: TransactionType,
  navigationToken: Optional<ERC20Token>,
  useRailgunBalances: boolean,
  erc20Amounts: ERC20Amount[]
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");
  const { txidVersion } = useReduxSelector("txidVersion");

  const activeWallet = wallets.active;

  const networkWalletBalances =
    erc20BalancesNetwork.forNetwork[network.current.name];
  const railgunWalletBalances =
    erc20BalancesRailgun.forNetwork[network.current.name];
  const tokenPrices =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];

  const currentTxidVersion = txidVersion.current;

  const tokenAlreadySelected = useCallback(
    (token: ERC20Token) => {
      for (const { token: selectedToken } of erc20Amounts) {
        if (compareTokens(token, selectedToken)) {
          return true;
        }
      }
      return false;
    },
    [erc20Amounts]
  );

  const topPickToken = useMemo(() => {
    if (navigationToken && !tokenAlreadySelected(navigationToken)) {
      return navigationToken;
    }

    const baseToken = getBaseTokenForNetwork(activeWallet, network.current);
    const wrappedBaseToken = getWrappedTokenForNetwork(
      activeWallet,
      network.current
    );

    const skippedTokens = erc20Amounts.map((ta) => ta.token);
    if (transactionType === TransactionType.Unshield && baseToken) {
      skippedTokens.push(baseToken);
    }
    if (
      erc20Amounts.length > 0 &&
      [TransactionType.Shield, TransactionType.Unshield].includes(
        transactionType
      )
    ) {
      if (transactionType === TransactionType.Shield && baseToken) {
        skippedTokens.push(baseToken);
      } else if (
        transactionType === TransactionType.Unshield &&
        wrappedBaseToken
      ) {
        skippedTokens.push(wrappedBaseToken);
      }
    }

    const isRailgun = useRailgunBalances;
    const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
    const topToken = getTopTokenForWallet(
      activeWallet,
      network.current.name,
      networkWalletBalances,
      railgunWalletBalances,
      tokenPrices,
      skippedTokens,
      isRailgun,
      currentTxidVersion,
      balanceBucketFilter
    );
    if (topToken && !tokenAlreadySelected(topToken)) {
      return topToken;
    }
    if (baseToken && !tokenFoundInList(baseToken, skippedTokens)) {
      return baseToken;
    }
    if (
      wrappedBaseToken &&
      !tokenFoundInList(wrappedBaseToken, skippedTokens)
    ) {
      return wrappedBaseToken;
    }

    return undefined;
  }, [
    navigationToken,
    tokenAlreadySelected,
    erc20Amounts,
    transactionType,
    useRailgunBalances,
    activeWallet,
    network,
    currentTxidVersion,
    networkWalletBalances,
    railgunWalletBalances,
    tokenPrices,
  ]);

  return { topPickToken };
};
