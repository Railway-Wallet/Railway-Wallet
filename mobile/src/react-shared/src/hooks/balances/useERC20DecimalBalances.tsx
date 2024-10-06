import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { useMemo } from "react";
import { ERC20Token } from "../../models/token";
import { AppSettingsService } from "../../services/settings/app-settings-service";
import { tokenBalancesForWalletAndState } from "../../services/wallet/wallet-balance-service";
import {
  tokenAddressForBalances,
  tokenAddressForPrices,
} from "../../utils/tokens";
import { getDecimalBalanceFromSerialized } from "../../utils/util";
import { useReduxSelector } from "../hooks-redux";

export const useERC20DecimalBalances = (
  token: ERC20Token,
  isRailgun: boolean,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { txidVersion } = useReduxSelector("txidVersion");
  const currentTxidVersion = txidVersion.current;

  const activeWallet = wallets.active;

  const erc20Balance = useMemo(() => {
    const networkWalletBalances =
      erc20BalancesNetwork.forNetwork[network.current.name];
    const railgunWalletBalances =
      erc20BalancesRailgun.forNetwork[network.current.name];

    if (!activeWallet || !isDefined(networkWalletBalances)) {
      return 0;
    }

    const tokenAddressBalances = tokenAddressForBalances(
      token.address,
      token.isBaseToken
    );
    const tokenBalances = tokenBalancesForWalletAndState(
      activeWallet,
      networkWalletBalances,
      railgunWalletBalances,
      isRailgun,
      currentTxidVersion,
      balanceBucketFilter
    );
    const tokenBalance = tokenBalances[tokenAddressBalances];
    if (isDefined(tokenBalance)) {
      return getDecimalBalanceFromSerialized(tokenBalance, token.decimals);
    }
    return 0;
  }, [
    isRailgun,
    network,
    activeWallet,
    erc20BalancesNetwork,
    erc20BalancesRailgun,
    token,
    currentTxidVersion,
    balanceBucketFilter,
  ]);

  const erc20BalanceCurrency = useMemo(() => {
    const pricesForNetwork =
      networkPrices.forNetwork[network.current.name]?.forCurrency[
        AppSettingsService.currency.code
      ];
    if (!isDefined(pricesForNetwork)) {
      return undefined;
    }

    const tokenAddressPrices = tokenAddressForPrices(token);
    const networkPrice = pricesForNetwork[tokenAddressPrices];
    return isDefined(pricesForNetwork) && isDefined(networkPrice)
      ? erc20Balance * networkPrice
      : undefined;
  }, [network, networkPrices.forNetwork, token, erc20Balance]);

  return { erc20Balance, erc20BalanceCurrency };
};
