import { isDefined } from "@railgun-community/shared-models";
import {
  CoinPaprikaApiEndpoint,
  createPaprikaRequestUrl,
  getCoinPaprikaData,
} from "./coinpaprika-service";
import {
  CoinPaprikaTokenDetails,
  CoinPaprikaTokenDetailsCache,
} from "./coinpaprika-token-details-cache";

export const getCoinPaprikaTokenID = async (
  symbol: string
): Promise<Optional<string>> => {
  const cachedTokenId = await CoinPaprikaTokenDetailsCache.getCachedID(
    createPaprikaRequestUrl(
      CoinPaprikaApiEndpoint.CachedInfo,

      `${symbol}`
    )
  );

  if (isDefined(cachedTokenId)) {
    return cachedTokenId;
  }
  return undefined;
};

export const getCoinPaprikaTokenDetails = async (
  symbol: string
): Promise<Optional<CoinPaprikaTokenDetails>> => {
  const tokenID = await getCoinPaprikaTokenID(symbol);
  if (!isDefined(tokenID)) {
    throw new Error(`No token ID for token ${symbol}`);
  }
  const url = createPaprikaRequestUrl(CoinPaprikaApiEndpoint.CoinInfo, tokenID);
  const cached = await CoinPaprikaTokenDetailsCache.getCached(url);
  if (isDefined(cached)) {
    return cached;
  }

  const tokenResult = await getCoinPaprikaData(
    CoinPaprikaApiEndpoint.CoinInfo,
    tokenID
  );
  if (isDefined(tokenResult) && !isDefined(tokenResult.error)) {
    const { data } = tokenResult;
    const tokenInfo: CoinPaprikaTokenDetails = {
      name: data.name,
      symbol: data.symbol,
      coinID: tokenID,
      image: {
        thumbnail: data.logo,
        small: data.logo,
        large: data.logo,
      },
    };
    await CoinPaprikaTokenDetailsCache.store(
      createPaprikaRequestUrl(CoinPaprikaApiEndpoint.CoinInfo, tokenID),
      tokenInfo
    );
    return tokenInfo;
  }
  return undefined;
};
