import { useMemo } from "react";
import { getERC20TokensForNetwork } from "../../services/wallet/wallet-balance-service";
import { filterTokensBySearchField } from "../../utils/tokens";
import { useReduxSelector } from "../hooks-redux";

export const useAddedTokenSearch = (searchText?: string) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const activeWallet = wallets.active;

  const search = searchText?.toLowerCase();

  const tokens = useMemo(() => {
    const tokens = getERC20TokensForNetwork(activeWallet, network.current.name);
    return filterTokensBySearchField(tokens, search);
  }, [activeWallet, network, search]);

  return { tokens };
};
