import { isDefined } from "@railgun-community/shared-models";
import axios from "axios";
import { ReactConfig } from "../../../config/react-config";
import { logDev } from "../../../utils/logging";

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/";

export enum CoingeckoApiEndpoint {
  PriceLookup = "simple/token_price/",
}

const MAX_NUM_RETRIES = 1;

const paramString = (params?: MapType<any>) => {
  if (!params) {
    return "";
  }
  const searchParams = new URLSearchParams(params);
  return searchParams.toString() ? `?${searchParams.toString()}` : "";
};

const createUrl = (
  endpoint: CoingeckoApiEndpoint | string,
  endpointParam?: string,
  params?: MapType<any>
) => {
  const url = `${COINGECKO_API_URL}${endpoint}${
    endpointParam ?? ""
  }${paramString(params)}`;
  return url;
};

export const getCoingeckoData = async (
  endpoint: CoingeckoApiEndpoint | string,
  endpointParam?: string,
  params?: MapType<any>,
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

  const url = createUrl(endpoint, endpointParam, params);
  try {
    return await axios.get(url, {
      method: "GET",
      headers,
    });
  } catch (cause) {
    if (!(cause instanceof Error)) {
      throw cause;
    }
    const err = new Error(`Failed to get data from Coingecko`, { cause });
    logDev(err);
    if (!isDefined(retryCount) || retryCount < MAX_NUM_RETRIES) {
      logDev("Retrying getCoingeckoData request...");
      return getCoingeckoData(
        endpoint,
        endpointParam,
        params,
        isDefined(retryCount) ? retryCount + 1 : 1
      );
    }
    throw err;
  }
};
