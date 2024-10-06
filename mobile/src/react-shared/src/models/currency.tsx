export type Currency = {
  name: string;
  code: string;
  coingeckoID: string;
  symbol: string;
};

export const CURRENCY_USD: Currency = {
  name: "US Dollar",
  code: "USD",
  coingeckoID: "usd",
  symbol: "$",
};

export const CURRENCY_EURO: Currency = {
  name: "Euro",
  code: "EUR",
  coingeckoID: "eur",
  symbol: "€",
};

export const CURRENCY_BTC: Currency = {
  name: "Bitcoin",
  code: "BTC",
  coingeckoID: "btc",
  symbol: "₿",
};

export const CURRENCY_ETH: Currency = {
  name: "Ethereum",
  code: "ETH",
  coingeckoID: "eth",
  symbol: "Ξ",
};

export const CURRENCY_JPY: Currency = {
  name: "Japanese Yen",
  code: "JPY",
  coingeckoID: "jpy",
  symbol: "¥",
};

export const CURRENCY_ARS: Currency = {
  name: "Argentine Peso",
  code: "ARS",
  coingeckoID: "ars",
  symbol: "ARS$",
};

export const CURRENCY_GBP: Currency = {
  name: "Pound Sterling",
  code: "GBP",
  coingeckoID: "gbp",
  symbol: "£",
};

export const CURRENCY_AUD: Currency = {
  name: "Australian Dollar",
  code: "AUD",
  coingeckoID: "aud",
  symbol: "AU$",
};

export const CURRENCY_CAD: Currency = {
  name: "Canadian Dollar",
  code: "CAD",
  coingeckoID: "cad",
  symbol: "CA$",
};

export const CURRENCY_INR: Currency = {
  name: "Indian Rupee",
  code: "INR",
  coingeckoID: "inr",
  symbol: "₹",
};

export const CURRENCY_NGN: Currency = {
  name: "Nigerian Naira",
  code: "NGN",
  coingeckoID: "ngn",
  symbol: "₦",
};

export const SUPPORTED_CURRENCIES: Currency[] = [
  CURRENCY_USD,
  CURRENCY_EURO,
  CURRENCY_BTC,
  CURRENCY_ETH,
  CURRENCY_JPY,
  CURRENCY_GBP,
  CURRENCY_INR,
  CURRENCY_NGN,
  CURRENCY_AUD,
  CURRENCY_ARS,
  CURRENCY_CAD,
];

export const DEFAULT_CURRENCY = CURRENCY_USD;
