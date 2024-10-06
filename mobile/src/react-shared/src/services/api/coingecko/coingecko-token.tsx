import { isDefined, Network } from "@railgun-community/shared-models";
import { CoingeckoTokenDetails } from "../../../models/token";
import { getCoingeckoData } from "./coingecko-service";
import { CoingeckoTokenDetailsCache } from "./coingecko-token-details-cache";

export const getCoingeckoTokenDetails = async (
  network: Network,
  address: string
): Promise<CoingeckoTokenDetails> => {
  const urlRoute = `coins/${network.coingeckoId}/contract/${address}`;
  const cached = await CoingeckoTokenDetailsCache.getCached(urlRoute);
  if (cached) {
    return cached;
  }

  const tokenResponse = await getCoingeckoData(urlRoute);

  const coingeckoToken: CoingeckoTokenDetails = await tokenResponse.data;

  if (isDefined(coingeckoToken) && !isDefined(tokenResponse.error)) {
    await CoingeckoTokenDetailsCache.store(urlRoute, coingeckoToken);
    return coingeckoToken;
  } else {
    throw new Error(tokenResponse.error);
  }
};
