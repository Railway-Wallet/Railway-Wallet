import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { ERC20TokenFullInfo, FrontendWallet } from "../../models";
import { compareTokenAddress } from "../../utils";
import { useReduxSelector } from "../hooks-redux";

export type FrontendLiquidityPair = {
  tokenA: ERC20TokenFullInfo;
  tokenB: ERC20TokenFullInfo;
};

const checkUnsupportedBaseToken = (
  isRailgun: boolean,
  token: Optional<ERC20TokenFullInfo>
) => {
  if (!isRailgun) return true;

  return !(token?.isBaseToken ?? false);
};

export const useLiquidityPairsForWalletFilter = (
  wallet: Optional<FrontendWallet>,
  networkName: NetworkName,
  isRailgun: boolean
) => {
  const { liquidity } = useReduxSelector("liquidity");

  const tokensForNetwork = wallet?.addedTokens[networkName];
  const liquidityPoolsForNetwork = liquidity.forNetwork[networkName]?.allPools;

  const { supportedLiquidityPairList, addedLiquidityTokenList } =
    useMemo(() => {
      const liquidityPairList: FrontendLiquidityPair[] = [];
      const liquidityTokenList: ERC20TokenFullInfo[] = [];

      if (
        !isDefined(tokensForNetwork) ||
        !isDefined(liquidityPoolsForNetwork)
      ) {
        return {
          supportedLiquidityPairList: liquidityPairList,
          addedLiquidityTokenList: liquidityTokenList,
        };
      }

      for (const lpData of liquidityPoolsForNetwork) {
        const tokenA = tokensForNetwork.find(
          (t) =>
            compareTokenAddress(t.address, lpData.tokenAddressA) &&
            checkUnsupportedBaseToken(isRailgun, t)
        );

        const tokenB = tokensForNetwork.find(
          (t) =>
            compareTokenAddress(t.address, lpData.tokenAddressB) &&
            checkUnsupportedBaseToken(isRailgun, t)
        );

        if (isDefined(tokenA) && isDefined(tokenB)) {
          const alreadyAdded = liquidityPairList.some(
            (pair) =>
              compareTokenAddress(pair.tokenA.address, tokenA.address) &&
              compareTokenAddress(pair.tokenB.address, tokenB.address)
          );

          if (!alreadyAdded) {
            liquidityPairList.push({ tokenA, tokenB });
          }
        }

        const liquidityToken = tokensForNetwork.find((t) =>
          compareTokenAddress(t.address, lpData.pairAddress)
        );
        if (isDefined(liquidityToken)) {
          liquidityTokenList.push(liquidityToken);
        }
      }

      return {
        supportedLiquidityPairList: liquidityPairList,
        addedLiquidityTokenList: liquidityTokenList,
      };
    }, [tokensForNetwork, liquidityPoolsForNetwork, isRailgun]);

  return {
    supportedLiquidityPairs: supportedLiquidityPairList,
    addedLiquidityTokens: addedLiquidityTokenList,
  };
};
