import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { useMemo } from "react";
import { ERC20Token, SearchableERC20 } from "../../models";
import { AppSettingsService } from "../../services/settings/app-settings-service";
import {
  getERC20TokensForNetwork,
  getTotalBalanceCurrency,
  tokenBalancesForWalletAndState,
} from "../../services/wallet/wallet-balance-service";
import { compareTokens } from "../../utils/tokens";
import { useReduxSelector } from "../hooks-redux";

export const useTotalBalanceCurrency = (
  isRailgun: boolean,
  balanceBucketFilter: RailgunWalletBalanceBucket[],
  token?: ERC20Token | SearchableERC20
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");

  const activeWallet = wallets.active;

  const tokens = getERC20TokensForNetwork(wallets.active, network.current.name);
  const networkWalletBalances =
    erc20BalancesNetwork.forNetwork[network.current.name];
  const railgunWalletBalances =
    erc20BalancesRailgun.forNetwork[network.current.name];
  const tokenPrices =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];
  const { txidVersion } = useReduxSelector("txidVersion");
  const currentTxidVersion = txidVersion.current;

  const totalBalanceCurrency = useMemo(() => {
    const tokenBalances = tokenBalancesForWalletAndState(
      activeWallet,
      networkWalletBalances,
      railgunWalletBalances,
      isRailgun,
      currentTxidVersion,
      balanceBucketFilter
    );
    if (!isDefined(tokenPrices)) {
      return 0;
    }

    return getTotalBalanceCurrency(
      isDefined(token) ? tokens.filter((t) => compareTokens(t, token)) : tokens,
      tokenBalances,
      tokenPrices
    );
  }, [
    activeWallet,
    networkWalletBalances,
    railgunWalletBalances,
    isRailgun,
    currentTxidVersion,
    balanceBucketFilter,
    tokenPrices,
    token,
    tokens,
  ]);

  return {
    totalBalanceCurrency,
  };
};
