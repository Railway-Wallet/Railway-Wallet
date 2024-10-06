import { isDefined } from "@railgun-community/shared-models";
import axios from "axios";
import { ReactConfig } from "../../../config/react-config";
import { logDev } from "../../../utils/logging";
import { CoinPaprikaTokenDetailsCache } from "./coinpaprika-token-details-cache";

const COINPAPRIKA_API_URL = "https://api.coinpaprika.com/v1/";
const MAX_NUM_RETRIES = 1;

export enum CoinPaprikaApiEndpoint {
  CacheInitialized = "INITIAL_CACHE|PAPRIKA|COININFO",
  CachedInfo = "cached|",
  CoinInfo = "coins/",
  Tickers = "tickers/",
}

const paramString = (params?: string[]): string => {
  if (isDefined(params)) {
    return `?quotes=${params.map((p) => p.toUpperCase()).join(",")}`;
  }
  return "";
};

export const createPaprikaRequestUrl = (
  endpoint: CoinPaprikaApiEndpoint | string,
  endpointCoinId?: string,
  params?: string[]
): string => {
  const url = `${COINPAPRIKA_API_URL}${endpoint}${
    endpointCoinId ?? ""
  }${paramString(params)}`;
  return url;
};

export const getCoinPaprikaData = async (
  endpoint: CoinPaprikaApiEndpoint | string,
  endpointCoinId?: string,
  params?: string[],
  retryCount?: number
): Promise<any> => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (ReactConfig.SHOULD_DISABLE_USER_AGENT) {
    // @ts-ignore
    headers["User-Agent"] = "";
  }

  const url = createPaprikaRequestUrl(endpoint, endpointCoinId, params);
  try {
    const response = await axios.get(url, {
      method: "GET",
      headers,
    });
    if (response.status === 200) {
      return response;
    }
    throw new Error("No data for requst?");
  } catch (cause) {
    if (!(cause instanceof Error)) {
      throw cause;
    }
    const err = new Error(`Failed to get data from CoinPaprika`, {
      cause,
    });
    logDev(err);
    if (!isDefined(retryCount) || retryCount < MAX_NUM_RETRIES) {
      logDev("Retrying getCoinPaprikaData request");
      return getCoinPaprikaData(
        endpoint,
        endpointCoinId,
        params,
        isDefined(retryCount) ? retryCount + 1 : 1
      );
    }
    throw err;
  }
};

export const populateCoinPaprikaInfoCache = async (): Promise<void> => {
  const isPopulated = await CoinPaprikaTokenDetailsCache.getCachedID(
    CoinPaprikaApiEndpoint.CacheInitialized
  );

  if (isDefined(isPopulated)) {
    logDev(`Paprika Cache was previously ${isPopulated}`);
    return;
  }

  const response = await getCoinPaprikaData(CoinPaprikaApiEndpoint.CoinInfo);
  if (isDefined(response) && !isDefined(response.error)) {
    const { data: responseData } = response;
    const symbolRanks: MapType<number> = {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    responseData.forEach(async ({ id, symbol, rank, is_active }: any) => {
      if (is_active === false || rank === 0) {
        return;
      }
      symbolRanks[symbol] ??= rank;
      const currentHighest = symbolRanks[symbol];
      if (!isDefined(currentHighest)) {
        return;
      }
      if (rank > currentHighest) {
        return;
      }

      await CoinPaprikaTokenDetailsCache.storeID(
        createPaprikaRequestUrl(
          CoinPaprikaApiEndpoint.CachedInfo,

          `${symbol}`
        ),
        id
      );
    });
    await CoinPaprikaTokenDetailsCache.storeID(
      CoinPaprikaApiEndpoint.CacheInitialized,
      "INITIALIZED"
    );
  }
};
