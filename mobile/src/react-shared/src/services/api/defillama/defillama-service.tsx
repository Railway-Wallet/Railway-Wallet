import { isDefined } from '@railgun-community/shared-models';
import axios, { AxiosResponse } from 'axios';
import { ReactConfig } from '../../../config/react-config';
import { logDev } from '../../../utils/logging';

const DEFILLAMA_API_URL = 'https://coins.llama.fi/';

export interface CoinPriceData {
  decimals: number;
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
}

export interface DefiLlamaPricesResponse {
  coins: Record<string, CoinPriceData>;
}

export enum DefiLlamaApiEndpoint {
  PriceLookup = 'prices/current',
}

const MAX_NUM_RETRIES = 1;

const paramString = (params?: Record<string, string>) => {
  if (!params) {
    return '';
  }
  const searchParams = new URLSearchParams(params);
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

const createUrl = (
  endpoint: DefiLlamaApiEndpoint | string,
  endpointParam?: string,
  params?: Record<string, string>,
) => {
  const url = `${DEFILLAMA_API_URL}${endpoint}${
    endpointParam ?? ''
  }${paramString(params)}`;
  return url;
};

export const getDefiLlamaData = async (
  endpoint: DefiLlamaApiEndpoint | string,
  endpointParam?: string,
  params?: Record<string, string>,
  retryCount?: number,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown,
): Promise<AxiosResponse<DefiLlamaPricesResponse>> => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (ReactConfig.SHOULD_DISABLE_USER_AGENT) {
    // @ts-ignore
    headers['User-Agent'] = '';
  }

  const url = createUrl(endpoint, endpointParam, params);
  try {
    return await axios({
      method,
      url,
      headers,
      data: body,
    });
  } catch (cause) {
    if (!(cause instanceof Error)) {
      throw cause;
    }
    const err = new Error(`Failed to get data from DefiLlama`, { cause });
    logDev(err);
    if (!isDefined(retryCount) || retryCount < MAX_NUM_RETRIES) {
      logDev('Retrying getDefiLlamaData request...');
      return getDefiLlamaData(
        endpoint,
        endpointParam,
        params,
        isDefined(retryCount) ? retryCount + 1 : 1,
      );
    }
    throw err;
  }
};
