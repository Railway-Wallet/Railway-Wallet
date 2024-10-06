import { isDefined } from "@railgun-community/shared-models";
import { SharedConstants } from "../../../config/shared-constants";
import { CoingeckoTokenDetails } from "../../../models/token";
import { logDevError } from "../../../utils/logging";
import { StorageService } from "../../storage/storage-service";

export class CoingeckoTokenDetailsCache {
  private static getStorageKey = (urlRoute: string) => {
    return `${SharedConstants.COINGECKO_TOKEN_DETAILS}|${urlRoute}`;
  };

  static getCached = async (
    urlRoute: string
  ): Promise<Optional<CoingeckoTokenDetails>> => {
    try {
      const storedCoingeckoToken = await StorageService.getItem(
        CoingeckoTokenDetailsCache.getStorageKey(urlRoute)
      );
      if (isDefined(storedCoingeckoToken) && !!storedCoingeckoToken) {
        const coingeckoToken: CoingeckoTokenDetails =
          JSON.parse(storedCoingeckoToken);
        if (
          isDefined(coingeckoToken.name) &&
          isDefined(coingeckoToken.symbol)
        ) {
          return coingeckoToken;
        }
      }
      return undefined;
    } catch (err) {
      logDevError(err);
      return undefined;
    }
  };

  static store = async (
    urlRoute: string,
    coingeckoToken: CoingeckoTokenDetails
  ): Promise<void> => {
    await StorageService.setItem(
      this.getStorageKey(urlRoute),
      JSON.stringify(coingeckoToken)
    );
  };

  static clear = async (urlRoute: string): Promise<void> => {
    await StorageService.removeItem(this.getStorageKey(urlRoute));
  };
}
