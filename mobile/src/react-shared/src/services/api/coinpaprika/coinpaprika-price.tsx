import { delay, isDefined } from "@railgun-community/shared-models";
import { Currency } from "../../../models";
import {
  CoinPaprikaApiEndpoint,
  getCoinPaprikaData,
} from "./coinpaprika-service";
import { getCoinPaprikaTokenID } from "./coinpaprika-token";

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
  currency: Currency
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
      [currency.code]
    );
    await delay(200);
    if (isDefined(tokenTicker)) {
      const { data } = tokenTicker;
      priceResults.push({
        price: data.quotes[currency.code].price,
        tokenAddress,
        updatedAt: Date.now(),
      });
    }
  }
  return priceResults;
};
