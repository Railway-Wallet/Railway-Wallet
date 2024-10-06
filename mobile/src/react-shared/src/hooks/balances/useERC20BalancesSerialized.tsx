import { RailgunWalletBalanceBucket } from "@railgun-community/shared-models";
import { tokenBalancesForWalletAndState } from "../../services/wallet/wallet-balance-service";
import { useReduxSelector } from "../hooks-redux";

export const useERC20BalancesSerialized = (
  useRailgunBalances: boolean,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { txidVersion } = useReduxSelector("txidVersion");

  const balancesForNetwork =
    erc20BalancesNetwork.forNetwork[network.current.name];
  const balancesForNetworkRailgun =
    erc20BalancesRailgun.forNetwork[network.current.name];

  const tokenBalancesSerialized = tokenBalancesForWalletAndState(
    wallets.active,
    balancesForNetwork,
    balancesForNetworkRailgun,
    useRailgunBalances,
    txidVersion.current,
    balanceBucketFilter
  );

  return { tokenBalancesSerialized };
};
