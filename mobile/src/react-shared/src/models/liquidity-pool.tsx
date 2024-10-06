import { UniswapV2Fork } from "@railgun-community/cookbook";

export type LiquidityV2PoolSerialized = {
  name: string;
  uniswapV2Fork: UniswapV2Fork;
  tokenAddressA: string;
  tokenSymbolA: string;
  tokenAddressB: string;
  tokenSymbolB: string;
  pairAddress: string;
  pairTokenName: string;
  pairTokenSymbol: string;
  tokenDecimalsA: string;
  tokenDecimalsB: string;
  pairTokenDecimals: string;
  rateWith18Decimals: string;
};
