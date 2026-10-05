import {
  FX_ADDRESSES,
  FxMintPoolName,
  FxPoolEntry,
  KNOWN_POOLS,
} from '@railgun-community/cookbook';

const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

const FX_TOKEN_SYMBOLS: Record<string, string> = {
  [FX_ADDRESSES.fxUSD.toLowerCase()]: 'fxUSD',
  [FX_ADDRESSES.wstETH.toLowerCase()]: 'wstETH',
  [FX_ADDRESSES.WETH.toLowerCase()]: 'WETH',
  [WBTC_ADDRESS.toLowerCase()]: 'WBTC',
};

export const fxTokenSymbol = (address: string): string => {
  const known = FX_TOKEN_SYMBOLS[address.toLowerCase()];
  if (known !== undefined) {
    return known;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

export const isFxUSD = (address: string): boolean =>
  address.toLowerCase() === FX_ADDRESSES.fxUSD.toLowerCase();

export const getFxPoolEntry = (name: FxMintPoolName): Optional<FxPoolEntry> =>
  KNOWN_POOLS.find(pool => pool.name === name);

export type FxPoolView = {
  name: FxMintPoolName;
  side: 'long' | 'short';
  collateralToken: string;
  collateralDecimals: number;
  collateralSymbol: string;
  debtToken: string;
  debtDecimals: number;
  debtSymbol: string;
  debtIsFxUSD: boolean;
};

export const getFxPoolView = (name: FxMintPoolName): Optional<FxPoolView> => {
  const entry = getFxPoolEntry(name);
  if (entry === undefined) {
    return undefined;
  }
  return {
    name: entry.name,
    side: entry.side,
    collateralToken: entry.collateralToken,
    collateralDecimals: Number(entry.collateralDecimals),
    collateralSymbol: fxTokenSymbol(entry.collateralToken),
    debtToken: entry.debtToken,
    debtDecimals: Number(entry.debtDecimals),
    debtSymbol: fxTokenSymbol(entry.debtToken),
    debtIsFxUSD: isFxUSD(entry.debtToken),
  };
};
