import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppSettingsService } from "../../services/settings/app-settings-service";
import { logDevRedux } from "../../utils/logging";

export type UpdatedTokenPrice = {
  tokenAddress: string;
  price: number;
};
export type UpdateTokenPricesPayload = {
  networkName: NetworkName;
  updatedTokenPrices: UpdatedTokenPrice[];
};

export type TokenPrices = MapType<number>;
export type NetworkCurrencyTokenPrices = {
  forCurrency: MapType<TokenPrices>;
};
export type NetworkTokenPriceState = {
  forNetwork: MapType<NetworkCurrencyTokenPrices>;
};
const DEFAULT_NETWORK_CURRENCY_PRICE_MAP: NetworkCurrencyTokenPrices = {
  forCurrency: {},
};

const initialState = {
  forNetwork: {},
} as NetworkTokenPriceState;

const slice = createSlice({
  name: "network-prices",
  initialState,
  reducers: {
    updateTokenPrices(state, action: PayloadAction<UpdateTokenPricesPayload>) {
      const { networkName, updatedTokenPrices } = action.payload;
      const currency = AppSettingsService.currency;

      const networkCurrencyPriceMap: NetworkCurrencyTokenPrices =
        state.forNetwork[networkName] ??
        JSON.parse(JSON.stringify(DEFAULT_NETWORK_CURRENCY_PRICE_MAP));

      if (!isDefined(networkCurrencyPriceMap.forCurrency[currency.code])) {
        networkCurrencyPriceMap.forCurrency[currency.code] = {};
      }
      const tokenPrices: TokenPrices = {
        ...networkCurrencyPriceMap.forCurrency[currency.code],
      };
      for (const { tokenAddress, price } of updatedTokenPrices) {
        tokenPrices[tokenAddress.toLowerCase()] = price;
      }
      networkCurrencyPriceMap.forCurrency[currency.code] = tokenPrices;

      state.forNetwork[networkName] = networkCurrencyPriceMap;

      logDevRedux(`update token prices: ${Date.now() / 1000}`);
      logDevRedux(state.forNetwork[networkName]);
    },
  },
});

export const { updateTokenPrices } = slice.actions;
export const networkPricesReducer = slice.reducer;
