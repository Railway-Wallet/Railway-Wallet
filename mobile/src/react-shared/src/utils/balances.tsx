import {
  isDefined,
  NetworkName,
  RailgunWalletBalanceBucket,
  TXIDVersion,
} from '@railgun-community/shared-models';
import { FrontendWallet } from '../models';
import {
  NetworkTokenPriceState,
  NetworkWalletBalanceState,
  RailgunWalletBalanceState,
} from '../redux-store';
import {
  AppSettingsService,
  getERC20TokensForNetwork,
  getTotalBalanceCurrency,
  tokenBalancesForWalletAndState,
} from '../services';

export const getTotalBalanceCurrencyForWallet = (
  isRailgun: boolean,
  balanceBucketFilter: RailgunWalletBalanceBucket[],
  wallet: FrontendWallet,
  networkName: NetworkName,
  networkPrices: NetworkTokenPriceState,
  currentTxidVersion: TXIDVersion,
  erc20BalancesNetwork: NetworkWalletBalanceState,
  erc20BalancesRailgun: RailgunWalletBalanceState,
) => {
  const tokens = getERC20TokensForNetwork(wallet, networkName);
  const networkWalletBalances = erc20BalancesNetwork.forNetwork[networkName];
  const railgunWalletBalances = erc20BalancesRailgun.forNetwork[networkName];
  const tokenPrices =
    networkPrices.forNetwork[networkName]?.forCurrency[
      AppSettingsService.currency.code
    ];

  const tokenBalances = tokenBalancesForWalletAndState(
    wallet,
    networkWalletBalances,
    railgunWalletBalances,
    isRailgun,
    currentTxidVersion,
    balanceBucketFilter,
  );

  if (!isDefined(tokenPrices)) {
    return 0;
  }

  return getTotalBalanceCurrency(tokens, tokenBalances, tokenPrices);
};
