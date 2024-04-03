import { isDefined } from '@railgun-community/shared-models';
import {
  CoinPaprikaApiEndpoint,
  getCoinPaprikaData,
} from './coinpaprika-service';
import { getCoinPaprikaTokenID } from './coinpaprika-token';

type TokenPrice = {
  price: number;
  tokenAddress: string;
  updatedAt: number;
};

export type CoinPaprikaQuery = {
  name: string;
  symbol: string;
  tokenAddress: string;
};

export const paprikaPriceLookup = async (
  tokenQueries: CoinPaprikaQuery[],
): Promise<TokenPrice[]> => {
  const priceResults: TokenPrice[] = [];
  for (const { symbol, tokenAddress } of tokenQueries) {
    const tokenID = await getCoinPaprikaTokenID(symbol);
    if (!isDefined(tokenID)) {
      continue;
    }
    const tokenTicker = await getCoinPaprikaData(
      CoinPaprikaApiEndpoint.Tickers,
      tokenID,
    );
    if (isDefined(tokenTicker)) {
      const { data } = tokenTicker;
      priceResults.push({
        price: data.quotes.USD.price,
        tokenAddress,
        updatedAt: Date.now(),
      });
    }
  }
  return priceResults;
};
