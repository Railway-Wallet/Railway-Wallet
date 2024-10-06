import {
  Currency,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
} from "../models/currency";

export const currencyName = (currency: Currency) => {
  return `${currency.name} (${currency.code})`;
};

export const getSupportedCurrency = (currency: Currency): Currency => {
  const supportedCurrencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code);
  if (supportedCurrencyCodes.includes(currency.code)) {
    return currency;
  }
  return DEFAULT_CURRENCY;
};
