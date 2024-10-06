import { delay, isDefined } from "@railgun-community/shared-models";
import { CoingeckoApiEndpoint, getCoingeckoData } from "./coingecko-service";

type TokenPrice = {
  price: number;
  tokenAddress: string;
  updatedAt: number;
};

export type CoingeckoPriceMap = MapType<CoingeckoPriceData>;
type CoingeckoPriceData = {
  last_updated_at: number;
};

export const priceLookup = async (
  coingeckoNetworkId: string,
  tokenAddresses: string[],
  currency: string
): Promise<TokenPrice[]> => {
  if (!coingeckoNetworkId) {
    return [];
  }
  if (!tokenAddresses.length) {
    return [];
  }

  const tokenPrices: TokenPrice[] = [];
  for (const tokenAddress of tokenAddresses) {
    const params = {
      contract_addresses: tokenAddress,
      vs_currencies: currency,
      include_last_updated_at: true,
    };

    const priceResponse = await getCoingeckoData(
      CoingeckoApiEndpoint.PriceLookup,
      coingeckoNetworkId,
      params
    ).catch(() => {
      return undefined;
    });
    await delay(2500);
    if (!isDefined(priceResponse)) {
      continue;
    }
    const coingeckoPriceMap: CoingeckoPriceMap = priceResponse.data;
    const coingeckoPriceData = coingeckoPriceMap[tokenAddress];
    if (!isDefined(coingeckoPriceData)) {
      continue;
    }

    tokenPrices.push({
      tokenAddress: tokenAddress.toLowerCase(),
      updatedAt: coingeckoPriceData.last_updated_at,
      price: (coingeckoPriceData as any)[currency],
    });
  }
  return tokenPrices;
};
