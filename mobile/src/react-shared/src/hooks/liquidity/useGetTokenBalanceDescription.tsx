import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { ERC20Token } from "../../models/token";
import {
  formatNumberToLocaleWithMinDecimals,
  getDecimalBalance,
  getTokenDisplayName,
  truncateStr,
} from "../../utils";
import { useERC20BalancesSerialized } from "../balances";
import { useReduxSelector } from "../hooks-redux";

export const useGetTokenBalanceDescription = (
  balanceBucketFilter: RailgunWalletBalanceBucket[]
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const useRailgunBalances = true;
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    useRailgunBalances,
    balanceBucketFilter
  );

  const getTokenBalanceDescription = (token: ERC20Token) => {
    let description = `${getTokenDisplayName(
      token,
      wallets.available,
      network.current.name
    )}`;
    const balance = tokenBalancesSerialized[token.address.toLowerCase()];
    const hasBalance = isDefined(balance);

    if (hasBalance && balance) {
      const balanceDecimal = getDecimalBalance(BigInt(balance), token.decimals);
      const balanceText = hasBalance
        ? balanceDecimal > 0 && balanceDecimal < 0.0001
          ? "<" + formatNumberToLocaleWithMinDecimals(0.0001, 4)
          : formatNumberToLocaleWithMinDecimals(balanceDecimal, 4)
        : undefined;

      description = `${truncateStr(balanceText, 12)} ${getTokenDisplayName(
        token,
        wallets.available,
        network.current.name
      )}`;
    }
    return description;
  };

  return { getTokenBalanceDescription };
};
