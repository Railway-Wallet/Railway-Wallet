import {
  getLPPairsForTokenAddresses,
  LiquidityV2Pool,
  RecipeERC20Info,
  UniswapV2Fork,
  UniV2LikeSDK,
} from "@railgun-community/cookbook";
import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { FrontendLiquidityPair } from "../hooks";
import { ERC20Token, FrontendWallet, TokenIconKey } from "../models";
import { LiquidityV2PoolSerialized } from "../models/liquidity-pool";
import {
  updateLiquidityPool,
  updateLiquidityPools,
} from "../redux-store/reducers/liquidity-reducer";
import { AppDispatch } from "../redux-store/store";
import { ProviderService } from "../services";
import { getSupportedNetworks } from "./networks";
import { compareTokenAddress, tokenMatchesSearchField } from "./tokens";
import {
  formatNumberToLocale,
  formatUnitFromHexStringToLocale,
  roundToNDecimals,
} from "./util";

const fetchLiquidityPairRate = async (
  uniswapV2Fork: UniswapV2Fork,
  networkName: NetworkName,
  erc20InfoA: ERC20Token,
  erc20InfoB: ERC20Token
): Promise<bigint> => {
  const provider = await ProviderService.getProvider(networkName);

  const tokenA: RecipeERC20Info = {
    tokenAddress: erc20InfoA.address,
    decimals: BigInt(erc20InfoA.decimals),
    isBaseToken: erc20InfoA.isBaseToken,
  };

  const tokenB: RecipeERC20Info = {
    tokenAddress: erc20InfoB.address,
    decimals: BigInt(erc20InfoB.decimals),
    isBaseToken: erc20InfoB.isBaseToken,
  };

  return await UniV2LikeSDK.getPairRateWith18Decimals(
    uniswapV2Fork,
    networkName,
    provider,
    tokenA,
    tokenB
  );
};

export const refreshLiquidityPairRate = async (
  dispatch: AppDispatch,
  liquidityPool: LiquidityV2Pool,
  networkName: NetworkName,
  wallet: FrontendWallet
) => {
  const addedTokens = wallet.addedTokens[networkName] ?? [];
  const tokenA = addedTokens.find((t) =>
    compareTokenAddress(t.address, liquidityPool.tokenAddressA)
  );

  const tokenB = addedTokens.find((t) =>
    compareTokenAddress(t.address, liquidityPool.tokenAddressB)
  );

  if (!isDefined(tokenA) || !isDefined(tokenB)) {
    throw new Error(
      "Refresh liquidity rate failed. Liquidity pair not found in wallet."
    );
  }

  const updatedRate = await fetchLiquidityPairRate(
    liquidityPool.uniswapV2Fork,
    networkName,
    tokenA,
    tokenB
  );

  dispatch(
    updateLiquidityPool({
      networkName,
      liquidityPool: {
        ...convertLiquidityPoolToSerialized(liquidityPool),
        rateWith18Decimals: updatedRate.toString(),
      },
    })
  );
};

export const fetchLiquidity = async (
  networkName: NetworkName,
  tokenAddresses: string[],
  dispatch: AppDispatch
): Promise<LiquidityV2Pool[]> => {
  const provider = await ProviderService.getProvider(networkName);

  const liquidityPools = await getLPPairsForTokenAddresses(
    provider,
    networkName,
    tokenAddresses
  );

  dispatch(
    updateLiquidityPools({
      networkName,
      liquidityPools: liquidityPools.map(convertLiquidityPoolToSerialized),
    })
  );

  return liquidityPools;
};

export const convertLiquidityPoolToSerialized = (
  liquidityPool: LiquidityV2Pool
): LiquidityV2PoolSerialized => {
  const serialized: LiquidityV2PoolSerialized = {
    ...liquidityPool,
    tokenDecimalsA: liquidityPool.tokenDecimalsA.toString(),
    tokenDecimalsB: liquidityPool.tokenDecimalsB.toString(),
    pairTokenDecimals: liquidityPool.pairTokenDecimals.toString(),
    rateWith18Decimals: liquidityPool.rateWith18Decimals.toString(),
  };
  return serialized;
};

export const convertSerializedToLiquidityPool = (
  liquidityPoolSerialized: LiquidityV2PoolSerialized
): LiquidityV2Pool => {
  const liquidityPool: LiquidityV2Pool = {
    ...liquidityPoolSerialized,
    tokenDecimalsA: BigInt(liquidityPoolSerialized.tokenDecimalsA),
    tokenDecimalsB: BigInt(liquidityPoolSerialized.tokenDecimalsB),
    pairTokenDecimals: BigInt(liquidityPoolSerialized.pairTokenDecimals),
    rateWith18Decimals: BigInt(liquidityPoolSerialized.rateWith18Decimals),
  };
  return liquidityPool;
};

export const getFilteredLiquidityPairs = (
  supportedLiquidityPairs: FrontendLiquidityPair[],
  tokenSearchText: string
) => {
  const filteredPools = supportedLiquidityPairs.filter((pool) => {
    const { tokenA, tokenB } = pool;
    const searchText = tokenSearchText?.toLowerCase();
    return (
      tokenMatchesSearchField(tokenA, searchText) ||
      tokenMatchesSearchField(tokenB, searchText)
    );
  });

  return filteredPools;
};

export const getLiquidityPoolMoreInfoLink = (
  uniswapV2Fork: UniswapV2Fork,
  address: string,
  chainId: number
) => {
  switch (uniswapV2Fork) {
    case UniswapV2Fork.Uniswap:
      return `https://v2.info.uniswap.org/pair/${address}`;

    case UniswapV2Fork.SushiSwap:
      return `https://www.sushi.com/pool/${chainId}:${address}`;

    case UniswapV2Fork.PancakeSwap:
      return "https://pancakeswap.finance/find";

    case UniswapV2Fork.Quickswap:
      return "https://quickswap.exchange/#/pools/v2";
  }
};

export const getLiquiditySourcesAndAssetsUrls = (
  networkName: NetworkName
): {
  liquiditySource: string;
  url: string;
}[] => {
  const chainIds = getSupportedNetworks()
    .map((n) => n.chain.id)
    .join(",");

  const sourceOptions = Object.values(UniswapV2Fork).map((pair) => {
    if (!UniV2LikeSDK.supportsForkAndNetwork(pair, networkName)) {
      return null;
    }

    switch (pair) {
      case UniswapV2Fork.Uniswap:
        return {
          liquiditySource: "Uniswap V2",
          url: "https://v2.info.uniswap.org/pairs",
        };
      case UniswapV2Fork.SushiSwap:
        return {
          liquiditySource: "SushiSwap V2",
          url: `https://www.sushi.com/pool?chainIds=${chainIds}&protocols=SUSHISWAP_V2`,
        };
      case UniswapV2Fork.PancakeSwap:
        return {
          liquiditySource: "PancakeSwap V2",
          url: `https://pancakeswap.finance/info/v2/pairs`,
        };
      case UniswapV2Fork.Quickswap:
        return {
          liquiditySource: "Quickswap V2",
          url: `https://quickswap.exchange/#/analytics/v2/pairs`,
        };
    }
  });

  return sourceOptions.filter(isDefined);
};

const reversePairRate = (pool: LiquidityV2Pool): bigint => {
  const oneUnit = 10n ** 18n;
  const reversedVaultRate =
    (oneUnit * oneUnit) / BigInt(pool.rateWith18Decimals);
  return reversedVaultRate;
};

export const getPairExchangeRateDisplayText = (
  pool: Optional<LiquidityV2Pool>
) => {
  if (!isDefined(pool)) {
    return "N/A";
  }
  const pairRate = reversePairRate(pool);
  const exchangeRate = formatUnitFromHexStringToLocale(pairRate, 18);
  const exchangeRateText = formatNumberToLocale(
    roundToNDecimals(Number(exchangeRate), 8)
  );
  return `1 ${pool.tokenSymbolA} = ${exchangeRateText} ${pool.tokenSymbolB}`;
};

export const getTokenIconKeyForPair = (pairName: UniswapV2Fork) => {
  switch (pairName) {
    case UniswapV2Fork.SushiSwap:
      return TokenIconKey.ImageRecipeTokenSushiswapKey;
    case UniswapV2Fork.Uniswap:
      return TokenIconKey.ImageRecipeTokenUniswapKey;
    case UniswapV2Fork.PancakeSwap:
      return TokenIconKey.ImageRecipeTokenPancakeSwapKey;
    case UniswapV2Fork.Quickswap:
      return TokenIconKey.ImageRecipeTokenQuickswapKey;
  }
};
