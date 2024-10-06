import { isDefined } from "@railgun-community/shared-models";
import { logDev } from "../../../utils";
import { StorageService } from "../../storage";

const COINPAPRIKA_TOKEN_DETAILS = "COINPAPRIKA_TOKEN_DETAILS";
export type CoinPaprikaTokenDetails = {
  name: string;
  symbol: string;
  image: {
    thumbnail: string;
    small: string;
    large: string;
  };
  coinID: string;
};

export class CoinPaprikaTokenDetailsCache {
  private static getStorageKey = (urlRoute: string) => {
    return `${COINPAPRIKA_TOKEN_DETAILS}|${urlRoute}`;
  };

  static getCached = async (
    urlRoute: string
  ): Promise<Optional<CoinPaprikaTokenDetails>> => {
    try {
      const storedCoinPaprikaToken = await StorageService.getItem(
        this.getStorageKey(urlRoute)
      );
      if (isDefined(storedCoinPaprikaToken) && !!storedCoinPaprikaToken) {
        const coinpPaprikaToken: CoinPaprikaTokenDetails = JSON.parse(
          storedCoinPaprikaToken
        );
        if (
          isDefined(coinpPaprikaToken.name) &&
          isDefined(coinpPaprikaToken.symbol) &&
          isDefined(coinpPaprikaToken.coinID)
        ) {
          return coinpPaprikaToken;
        }
      }
    } catch (error) {
      logDev(error);
    }
    return undefined;
  };
  static store = async (
    urlRoute: string,
    coinPaprikaToken: CoinPaprikaTokenDetails
  ): Promise<void> => {
    await StorageService.setItem(
      this.getStorageKey(urlRoute),
      JSON.stringify(coinPaprikaToken)
    );
  };
  static storeID = async (
    urlRoute: string,
    coinPaprikaTokenID: string
  ): Promise<void> => {
    await StorageService.setItem(
      this.getStorageKey(urlRoute),
      coinPaprikaTokenID
    );
  };

  static getCachedID = async (urlRoute: string): Promise<Optional<string>> => {
    try {
      const storedCoinPaprikaTokenID = await StorageService.getItem(
        this.getStorageKey(urlRoute)
      );
      if (isDefined(storedCoinPaprikaTokenID) && !!storedCoinPaprikaTokenID) {
        return storedCoinPaprikaTokenID;
      }
    } catch (error) {
      logDev(error);
    }
    return undefined;
  };

  static clear = async (urlRoute: string): Promise<void> => {
    await StorageService.removeItem(this.getStorageKey(urlRoute));
  };
}
