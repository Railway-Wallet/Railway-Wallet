import { delay, isDefined } from '@railgun-community/shared-models';
import { logDev } from '../../..';
import { DefiLlamaApiEndpoint, getDefiLlamaData } from './defillama-service';

export type TokenPrice = {
  price: number;
  tokenAddress: string;
  updatedAt: number;
};

export type DefiLlamaPriceMap = MapType<DefiLlamaPriceData>;
type DefiLlamaPriceData = {
  decimals: number;
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
};

export const defillamaPriceLookup = async (
  networkName: string,
  tokenAddresses: string[],
): Promise<TokenPrice[]> => {
  if (!tokenAddresses.length) {
    return [];
  }

  const tokenPrices: TokenPrice[] = [];

  const coinIds = tokenAddresses.map(
    addr => `${networkName.toLowerCase()}:${addr}`,
  );

  try {
    const coinsParam = coinIds.join(',');

    const priceResponse = await getDefiLlamaData(
      DefiLlamaApiEndpoint.PriceLookup,
      `/${coinsParam}`,
    );

    const defillamaPriceMap: DefiLlamaPriceMap = priceResponse.data.coins;

    for (const coinId of coinIds) {
      const defillamaPriceData = defillamaPriceMap[coinId];
      if (!isDefined(defillamaPriceData)) {
        continue;
      }

      const tokenAddress = coinId.split(':')[1].toLowerCase();

      tokenPrices.push({
        tokenAddress,
        updatedAt: defillamaPriceData.timestamp * 1000,
        price: defillamaPriceData.price,
      });
    }

    await delay(500);
  } catch (error) {
    logDev('Failed getting prices from DefiLlama API:', error);
    return [];
  }

  return tokenPrices;
};
