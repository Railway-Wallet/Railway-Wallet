import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { ERC20Token } from "../../models/token";
import { FrontendWallet } from "../../models/wallet";
import {
  calculateTokenBalance,
  tokenBalancesForWalletAndState,
} from "../../services/wallet/wallet-balance-service";
import { useReduxSelector } from "../hooks-redux";

export const useERC20Balance = (
  wallet: Optional<FrontendWallet>,
  token: Optional<ERC20Token>,
  isRailgunBalance: boolean,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
) => {
  const { network } = useReduxSelector("network");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");
  const { txidVersion } = useReduxSelector("txidVersion");

  const networkWalletBalances =
    erc20BalancesNetwork.forNetwork[network.current.name];
  const railgunWalletBalances =
    erc20BalancesRailgun.forNetwork[network.current.name];

  const currentTxidVersion = txidVersion.current;

  const tokenBalance: Optional<bigint> = useMemo(() => {
    if (!wallet || !token) {
      return undefined;
    }

    const tokenBalances = tokenBalancesForWalletAndState(
      wallet,
      networkWalletBalances,
      railgunWalletBalances,
      isRailgunBalance,
      currentTxidVersion,
      balanceBucketFilter
    );
    return calculateTokenBalance(
      wallet,
      token,
      tokenBalances,
      isRailgunBalance
    );
  }, [
    wallet,
    token,
    networkWalletBalances,
    railgunWalletBalances,
    isRailgunBalance,
    currentTxidVersion,
    balanceBucketFilter,
  ]);

  return { tokenBalance };
};
