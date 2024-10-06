import { LiquidityV2Pool } from "@railgun-community/cookbook";
import { isDefined } from "@railgun-community/shared-models";
import { useEffect, useState } from "react";
import { ERC20TokenAddressOnly, SearchableERC20 } from "../../models/token";
import { getFullERC20TokenInfo } from "../../services/token";
import { findMatchingAddedTokenForWallet } from "../../utils/tokens";
import { useReduxSelector } from "../hooks-redux";

export const useGetLiquidityTokensToAdd = (
  liquidityPool: Optional<LiquidityV2Pool>
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const availableWallets = wallets.available;
  const activeWallet = wallets.active;

  const [tokensToAdd, setTokensToAdd] =
    useState<Optional<SearchableERC20[]>>(undefined);

  useEffect(() => {
    const getTokensToAdd = async () => {
      const tokensToAdd: Optional<SearchableERC20[]> = [];

      if (!liquidityPool) {
        setTokensToAdd(undefined);
        return;
      }

      const tokenA: ERC20TokenAddressOnly = {
        isAddressOnly: true,
        isBaseToken: false,
        address: liquidityPool.tokenAddressA,
        decimals: Number(liquidityPool.tokenDecimalsA),
      };
      const tokenB: ERC20TokenAddressOnly = {
        isAddressOnly: true,
        isBaseToken: false,
        address: liquidityPool.tokenAddressB,
        decimals: Number(liquidityPool.tokenDecimalsB),
      };

      if (
        !isDefined(
          findMatchingAddedTokenForWallet(
            tokenA,
            activeWallet,
            network.current.name
          )
        )
      ) {
        const tokenToAddA = await getFullERC20TokenInfo(
          tokenA,
          availableWallets,
          network.current
        );
        tokensToAdd.push(tokenToAddA);
      }

      if (
        !isDefined(
          findMatchingAddedTokenForWallet(
            tokenB,
            activeWallet,
            network.current.name
          )
        )
      ) {
        const tokenToAddB = await getFullERC20TokenInfo(
          tokenB,
          availableWallets,
          network.current
        );
        tokensToAdd.push(tokenToAddB);
      }

      setTokensToAdd(tokensToAdd);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getTokensToAdd();
  }, [availableWallets, activeWallet, liquidityPool, network]);

  return { tokensToAdd };
};
