import {
  isDefined,
  Network,
  NETWORK_CONFIG,
} from '@railgun-community/shared-models';
import { ReactConfig } from '../../config/react-config';
import { SharedConstants } from '../../config/shared-constants';
import { Currency } from '../../models';
import { ToastType } from '../../models/toast';
import { ERC20Token, ERC20TokenFullInfo } from '../../models/token';
import { FrontendWallet } from '../../models/wallet';
import {
  UpdatedTokenPrice,
  updateTokenPrices,
} from '../../redux-store/reducers/network-price-reducer';
import { showImmediateToast } from '../../redux-store/reducers/toast-reducer';
import { AppDispatch } from '../../redux-store/store';
import { logDev, logDevError } from '../../utils/logging';
import { priceLookup } from '../api/coingecko';
import {
  CoinPaprikaQuery,
  paprikaPriceLookup,
  populateCoinPaprikaInfoCache,
} from '../api/coinpaprika';
import { defillamaPriceLookup } from '../api/defillama';
import { AppSettingsService } from '../settings';
import { getERC20TokensForNetwork } from './wallet-balance-service';

type TokenPrice = {
  price: number;
  tokenAddress: string;
  updatedAt: number;
};

const pullingPricesForNetwork: MapType<MapType<boolean>> = {};

export const tokenPriceUndefinedLabel = (
  network: Network,
  noPriceStr: string = 'N/A',
): string => {
  return pullingPricesForNetworkAndCurrency(network) ? '' : noPriceStr;
};

export const pullingPricesForNetworkAndCurrency = (
  network: Network,
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
  currency: Currency,
): Promise<boolean> => {
  const networkName = network.name;
  try {
    await populateCoinPaprikaInfoCache();

    const tokenPricesByAddress = await paprikaPriceLookup(
      paprikaQueries,
      currency,
    );

    dispatch(
      updateTokenPrices({
        networkName,
        updatedTokenPrices: tokenPricesByAddress,
      }),
    );
    return true;
  } catch (error) {
    logDevError(
      new Error(
        `Paprika Error: Error pulling ERC20 token prices for ${networkName}`,
        {
          cause: error,
        },
      ),
    );
  }
  return false;
};

export const pullERC20TokenPricesForNetwork = async (
  dispatch: AppDispatch,
  wallet: Optional<FrontendWallet>,
  network: Network,
): Promise<void> => {
  const currency = AppSettingsService.currency;
  if (pullingPricesForNetworkAndCurrency(network)) {
    logDev('Already pulling prices for network/currency');
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
      }),
    );
    return;
  }

  pullingPricesForNetwork[networkName] ??= {};
  const pullingPricesNetwork = pullingPricesForNetwork[networkName];
  if (!isDefined(pullingPricesNetwork)) {
    return;
  }

  pullingPricesNetwork[currency.code] = true;

  const tokenAddresses = walletTokens.map(t => t.address);

  let lastError: Error | unknown;

  try {
    const defillamaPrices = await defillamaPriceLookup(
      networkName,
      tokenAddresses,
    );
    if (defillamaPrices.length > 0) {
      pullingPricesNetwork[currency.code] = false;
      dispatch(
        updateTokenPrices({
          networkName,
          updatedTokenPrices: defillamaPrices.map((tp: TokenPrice) => ({
            tokenAddress: tp.tokenAddress,
            price: tp.price,
          })),
        }),
      );
      return;
    }
  } catch (defiErr) {
    lastError = defiErr;
  }

  try {
    const tokenPricesByAddress = await priceLookup(
      network.coingeckoId,
      tokenAddresses,
      currency.coingeckoID,
    );
    if (tokenPricesByAddress.length > 0) {
      pullingPricesNetwork[currency.code] = false;
      dispatch(
        updateTokenPrices({
          networkName,
          updatedTokenPrices: tokenPricesByAddress,
        }),
      );
      return;
    }
  } catch (coingeckoErr) {
    lastError = coingeckoErr;
  }

  try {
    const paprikaQueries = walletTokens.map(t => {
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
      currency,
    );
    pullingPricesNetwork[currency.code] = false;
    if (fallbackSuccess === true) {
      return;
    }
  } catch (paprikaErr) {
    lastError = paprikaErr;
  }

  pullingPricesNetwork[currency.code] = false;
  if (lastError !== undefined) {
    logDevError(
      new Error(`Error pulling ERC20 token prices for ${networkName}`, {
        cause: lastError,
      }),
    );
    if (!(lastError instanceof Error)) {
      throw lastError;
    }
    if (lastError.message.includes('provider destroyed')) return;

    if (typeof window !== 'undefined' && window.navigator.onLine) {
      dispatch(
        showImmediateToast({
          message: `Could not load current token prices. ${lastError.message}`,
          type: ToastType.Error,
        }),
      );
    }
  } else {
    if (typeof window !== 'undefined' && window.navigator.onLine) {
      dispatch(
        showImmediateToast({
          message: `Could not load current token prices. All price services returned no results.`,
          type: ToastType.Error,
        }),
      );
    }
  }
};

const zeroPricesForAllTokens = (
  walletTokens: ERC20Token[],
): UpdatedTokenPrice[] => {
  return walletTokens.map(t => {
    return {
      tokenAddress: t.address,
      price: 0,
    };
  });
};
