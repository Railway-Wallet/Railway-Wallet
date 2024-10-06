import {
  isDefined,
  Network,
  NETWORK_CONFIG,
} from "@railgun-community/shared-models";
import { ReactConfig } from "../../config/react-config";
import { SharedConstants } from "../../config/shared-constants";
import { Currency } from "../../models";
import { ToastType } from "../../models/toast";
import { ERC20Token, ERC20TokenFullInfo } from "../../models/token";
import { FrontendWallet } from "../../models/wallet";
import {
  UpdatedTokenPrice,
  updateTokenPrices,
} from "../../redux-store/reducers/network-price-reducer";
import { showImmediateToast } from "../../redux-store/reducers/toast-reducer";
import { AppDispatch } from "../../redux-store/store";
import { logDev, logDevError } from "../../utils/logging";
import { priceLookup } from "../api/coingecko";
import {
  CoinPaprikaQuery,
  paprikaPriceLookup,
  populateCoinPaprikaInfoCache,
} from "../api/coinpaprika";
import { AppSettingsService } from "../settings";
import { getERC20TokensForNetwork } from "./wallet-balance-service";

const pullingPricesForNetwork: MapType<MapType<boolean>> = {};

export const tokenPriceUndefinedLabel = (
  network: Network,
  noPriceStr: string = "N/A"
): string => {
  return pullingPricesForNetworkAndCurrency(network) ? "" : noPriceStr;
};

export const pullingPricesForNetworkAndCurrency = (
  network: Network
): boolean => {
  const pullingPricesNetwork = pullingPricesForNetwork[network.name];
  if (isDefined(pullingPricesNetwork)) {
    return pullingPricesNetwork[AppSettingsService.currency.code] ?? false;
  }
  return false;
};

const pollPaprikaFallback = async (
  network: Network,
  paprikaQueries: CoinPaprikaQuery[],
  dispatch: AppDispatch,
  currency: Currency
): Promise<boolean> => {
  const networkName = network.name;
  try {
    await populateCoinPaprikaInfoCache();

    const tokenPricesByAddress = await paprikaPriceLookup(
      paprikaQueries,
      currency
    );

    dispatch(
      updateTokenPrices({
        networkName,
        updatedTokenPrices: tokenPricesByAddress,
      })
    );
    return true;
  } catch (error) {
    logDevError(
      new Error(
        `Paprika Error: Error pulling ERC20 token prices for ${networkName}`,
        {
          cause: error,
        }
      )
    );
  }
  return false;
};

export const pullERC20TokenPricesForNetwork = async (
  dispatch: AppDispatch,
  wallet: Optional<FrontendWallet>,
  network: Network
): Promise<void> => {
  const currency = AppSettingsService.currency;
  if (pullingPricesForNetworkAndCurrency(network)) {
    logDev("Already pulling prices for network/currency");
    return;
  }

  const networkName = network.name;
  const walletTokens = getERC20TokensForNetwork(wallet, networkName);

  const useCoingeckoPricesInDev =
    ReactConfig.IS_DEV &&
    SharedConstants.USE_COINGECKO_PRICES_FOR_TESTNETS_IN_DEV;
  if (
    NETWORK_CONFIG[networkName].isTestnet === true &&
    !useCoingeckoPricesInDev
  ) {
    dispatch(
      updateTokenPrices({
        networkName,
        updatedTokenPrices: zeroPricesForAllTokens(walletTokens),
      })
    );
    return;
  }

  pullingPricesForNetwork[networkName] ??= {};
  const pullingPricesNetwork = pullingPricesForNetwork[networkName];
  if (!isDefined(pullingPricesNetwork)) {
    return;
  }

  pullingPricesNetwork[currency.code] = true;

  const tokenAddresses = walletTokens.map((t) => t.address);

  try {
    const paprikaQueries = walletTokens.map((t) => {
      const allToken = t as ERC20TokenFullInfo;
      return {
        name: allToken.name,
        symbol: allToken.symbol,
        tokenAddress: allToken.address,
      };
    });
    const fallbackSuccess = await pollPaprikaFallback(
      network,
      paprikaQueries,
      dispatch,
      currency
    );
    pullingPricesNetwork[currency.code] = false;
    if (fallbackSuccess === true) {
      return;
    }
  } catch (err) {
    const tokenPricesByAddress = await priceLookup(
      network.coingeckoId,
      tokenAddresses,
      currency.coingeckoID
    );
    pullingPricesNetwork[currency.code] = false;
    dispatch(
      updateTokenPrices({
        networkName,
        updatedTokenPrices: tokenPricesByAddress,
      })
    );
    logDevError(
      new Error(`Error pulling ERC20 token prices for ${networkName}`, {
        cause: err,
      })
    );
    if (!(err instanceof Error)) {
      throw err;
    }
    if (err.message.includes("provider destroyed")) return;

    if (window.navigator.onLine) {
      dispatch(
        showImmediateToast({
          message: `Could not load current token prices. ${err.message}`,
          type: ToastType.Error,
        })
      );
    }
  }
};

const zeroPricesForAllTokens = (
  walletTokens: ERC20Token[]
): UpdatedTokenPrice[] => {
  return walletTokens.map((t) => {
    return {
      tokenAddress: t.address,
      price: 0,
    };
  });
};
