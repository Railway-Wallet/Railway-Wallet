import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { formatUnits, Mnemonic, parseUnits } from "ethers";
import { TransactionType } from "../models/transaction";
import {
  AppSettingsService,
  DEFAULT_LOCALE,
} from "../services/settings/app-settings-service";
import { maxBigInt } from "./big-numbers";
import { logDev, logDevError } from "./logging";

export const formatNumberToLocale = (number: number | string) => {
  const locale = [AppSettingsService.locale, DEFAULT_LOCALE];
  const stringifyNumber = numToPlainString(number);
  const decimalSymbol = localDecimalSymbol();

  const options = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  const [mainString, decimalString] = stringifyNumber.split(".");
  const formattedMain = new Intl.NumberFormat(locale, options).format(
    Number(mainString)
  );

  if (stringifyNumber.match(/^\d+\.$/)) {
    return `${formattedMain}${decimalSymbol}`;
  }

  if (decimalString) {
    return `${formattedMain}${decimalSymbol}${decimalString}`;
  }

  return formattedMain;
};

export const formatNumberToLocaleWithMinDecimals = (
  number: string | number,
  decimals: number,
  minDecimals = 2
) => {
  const decimalSeparator = localDecimalSymbol();

  const formattedNumber = formatNumberToLocale(number);

  const [mainString, decimalString] = formattedNumber.split(decimalSeparator);

  if (!decimalString) {
    const zeros = "0".repeat(minDecimals);
    return `${mainString}${decimalSeparator}${zeros}`;
  }
  if (decimalString.length <= minDecimals) {
    const zeros = "0".repeat(minDecimals - decimalString.length);
    if (zeros) {
      return `${mainString}${decimalSeparator}${decimalString}${zeros}`;
    }
    return formattedNumber;
  }

  const decimalNotRounded = decimalString.slice(0, decimals);
  return `${mainString}${decimalSeparator}${decimalNotRounded}`;
};

export const formatUnitFromHexString = (
  number: string | bigint,
  decimals: number
): string => {
  try {
    return formatUnits(number, decimals);
  } catch {
    return "[OVERFLOW]";
  }
};

export const formatUnitFromHexStringToLocale = (
  number: string | bigint,
  decimals: number
) => {
  return formatNumberToLocaleWithMinDecimals(
    formatUnitFromHexString(number, decimals),
    decimals
  );
};

export const copyByValue = <T,>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const valuesWithinThreshold = (
  value1: number,
  value2: number,
  threshold: number
): boolean => {
  const difference = Math.abs(value1 - value2);
  const average = (value1 + value2) / 2;
  const percentageDifference = difference / average;
  return percentageDifference <= threshold;
};

export const absBigInt = (n: bigint): bigint => {
  return n < 0n ? -n : n;
};

export const valuesWithinThresholdBigNumber = (
  value1: bigint,
  value2: bigint,
  threshold: number
): boolean => {
  const diff = absBigInt(value1 - value2);
  const maxNum = maxBigInt(value1, value2);
  const percentDiff = (diff * 100n) / maxNum;
  return percentDiff <= BigInt(threshold * 100);
};

export const localDecimalSymbol = () => {
  return (1.1).toLocaleString(AppSettingsService.locale).substring(1, 2);
};

export const roundStringToNDecimals = (value: string, n: number): string => {
  const num = Number(value);
  return roundToNDecimals(num, n);
};

export const numToPlainString = (num: number | string): string => {
  if (typeof num === "string") {
    return num;
  }

  return ("" + +num).replace(
    /(-?)(\d*)\.?(\d*)e([+-]\d+)/,
    function (a, b, c, d, e) {
      return e < 0
        ? b + "0." + Array(1 - e - c.length).join("0") + c + d
        : b + c + d + Array(e - d.length + 1).join("0");
    }
  );
};

export const roundToNDecimals = (value: number, n: number): string => {
  const rounded = Number(
    +(Math.round(Number(numToPlainString(value) + "e+" + n)) + "e-" + n)
  );
  return rounded.toFixed(n);
};

export const bigintToHexString = (n: bigint): string => {
  return "0x" + n.toString(16);
};

export const decimalToHexString = (dec: number | string): string => {
  return bigintToHexString(BigInt(dec));
};

export const stringEntryToBigInt = (
  entry: string,
  decimals: number
): bigint => {
  if (entry === "") {
    return 0n;
  }
  try {
    return parseUnits(entry, decimals);
  } catch (err) {
    logDev("Invalid string number entry - returning 0n");
    logDevError(err);
    return 0n;
  }
};

export const endsWithAny = (text: string, suffixList: string[]): boolean => {
  return isDefined(
    suffixList.find((suffix) => {
      return text.endsWith(suffix);
    })
  );
};

export const requiresTokenApproval = (
  transactionType: TransactionType,
  isPrivate: boolean,
  isBaseToken: Optional<boolean>
) => {
  switch (transactionType) {
    case TransactionType.Shield:
    case TransactionType.Swap:
      return !isPrivate && !(isBaseToken ?? false);
    case TransactionType.ApproveShield:
    case TransactionType.Unshield:
    case TransactionType.Send:
    case TransactionType.ApproveSpender:
    case TransactionType.Mint:
    case TransactionType.FarmDeposit:
    case TransactionType.FarmRedeem:
    case TransactionType.AddLiquidity:
    case TransactionType.RemoveLiquidity:
    case TransactionType.Cancel:
      return false;
  }
};

export const formatGasFeeForCurrency = (
  gasTokenPrice: Optional<number>,
  gasAmount: number,
  showExactCurrencyGasPrice: boolean = false
): string => {
  const currentCurrencySymbol = AppSettingsService.currency.symbol;
  if (!isDefined(gasTokenPrice)) {
    return "Unknown price";
  }
  const price = gasTokenPrice * gasAmount;
  if (price > 0 && price < 0.0001 && !showExactCurrencyGasPrice) {
    return `< ${currentCurrencySymbol}${formatNumberToLocaleWithMinDecimals(
      0.0001,
      4
    )}`;
  }
  return `${currentCurrencySymbol}${formatNumberToLocaleWithMinDecimals(
    gasTokenPrice * gasAmount,
    7
  )}`;
};

export const generateKey = (length = 16) => {
  const CHARSET = "abcdefghijklnopqrstuvwxyz0123456789";
  let retVal = "";
  for (let i = 0; i < length; i += 1) {
    retVal += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return retVal;
};

export const capitalize = (str: string) => {
  if (!str.length) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const shortenWalletAddress = (address: string): string => {
  if (address.length < 13) {
    return address;
  }
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
};

export const shortenTokenAddress = (address: string): string => {
  if (address.length < 10) {
    return address;
  }

  return `${address.slice(0, 5)}...${address.slice(-3)}`;
};

export const maxBigIntForTransaction = (): bigint => {
  return BigInt(2) ** BigInt(256) - 1n;
};

export const getDecimalBalance = (
  balance: bigint,
  decimals: number
): number => {
  return Number(formatUnits(balance, decimals));
};

export const weiToRoundedGwei = (wei: bigint) => {
  return wei / 10n ** 9n;
};

export const gweiToWei = (gwei: bigint) => {
  return gwei * 10n ** 9n;
};

export const getDecimalBalanceString = (
  balance: bigint,
  decimals: number
): string => {
  return formatNumberToLocale(formatUnits(balance, decimals));
};

export const getDecimalBalanceFromSerialized = (
  balanceSerialized: string | bigint,
  decimals: number
): number => {
  return getDecimalBalance(BigInt(balanceSerialized), decimals);
};

export const getDecimalBalanceCurrency = (
  balance: bigint,
  price: number,
  decimals: number
) => {
  const decimalBalance = getDecimalBalance(balance, decimals);
  return decimalBalance * price;
};

const containsChar = (value: string, char: string): boolean => {
  return value.indexOf(char) >= 0;
};

export const easeInCubic = (x: number): number => {
  return x * x * x;
};

export const validateMnemonic = (value: string): boolean => {
  if (!containsChar(value, " ")) {
    return false;
  }
  return Mnemonic.isValidMnemonic(value);
};

export const validateWalletName = (value: string): boolean => {
  return value.length > 0;
};

export const formatTransactionTimestamp = (txTimestamp: number) => {
  const now = Date.now() / 1000;
  const txSecAgo = now - txTimestamp;
  let timeStr = "";
  if (txSecAgo < 60) {
    timeStr = `${Math.round(txSecAgo)}s`;
  } else if (txSecAgo < 60 * 60) {
    timeStr = `${Math.round(txSecAgo / 60)}m`;
  } else if (txSecAgo < 60 * 60 * 24) {
    timeStr = `${Math.round(txSecAgo / (60 * 60))}h`;
  } else if (txSecAgo < 60 * 60 * 24 * 7) {
    timeStr = `${Math.round(txSecAgo / (60 * 60 * 24))}d`;
  } else {
    timeStr = `${Math.round(txSecAgo / (60 * 60 * 24 * 7))}w`;
  }
  return timeStr + " ago";
};

export const truncateStr = (
  str: Optional<string>,
  length: number,
  append = "…"
) => {
  if (!isDefined(str)) {
    return;
  }
  const lengthWithBuffer = length + append.length;
  return str.length > lengthWithBuffer ? str.slice(0, length) + append : str;
};

export const dedupeByParam = <T,>(array: T[], param: string): T[] => {
  const deduped: T[] = [];
  const found: string[] = [];

  for (const obj of array) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (obj as any)[param];

    if (found.includes(value)) {
      continue;
    }

    found.push(value);
    deduped.push(obj);
  }

  return deduped;
};

export const getSlippageBasisPoints = (slippagePercentage: number): bigint => {
  return BigInt(Math.round(slippagePercentage * 10000));
};

export const formatEntryAmountWithFeesIfNeeded = (
  numEntryString: string,
  tokenDecimals: number,
  shieldFee: Optional<string>,
  unshieldFee: Optional<string>
): { finalEntryBigInt: bigint; finalEntryString: string } => {
  let total = stringEntryToBigInt(numEntryString, tokenDecimals);
  if (isDefined(shieldFee)) {
    const { base, fee } = getFee(total, false, BigInt(shieldFee));

    total = base + fee;
  }

  if (isDefined(unshieldFee)) {
    const { base, fee } = getFee(total, false, BigInt(unshieldFee));

    total = base + fee;
  }

  return {
    finalEntryBigInt: total,
    finalEntryString: getDecimalBalanceString(total, tokenDecimals),
  };
};

export const getFee = (
  amount: bigint,
  isInclusive: boolean,
  feeBP: bigint
): { base: bigint; fee: bigint } => {
  const BASIS_POINTS = 10000n;
  let base;
  let fee;

  if (isInclusive) {
    base = amount - (amount * feeBP) / BASIS_POINTS;
    fee = amount - base;
  } else {
    base = amount;
    fee = (BASIS_POINTS * base) / (BASIS_POINTS - feeBP) - base;
  }

  return { base, fee };
};

export const isNonSpendableBucket = (
  balanceBucket: RailgunWalletBalanceBucket
) => {
  return (
    balanceBucket !== RailgunWalletBalanceBucket.Spendable &&
    balanceBucket !== RailgunWalletBalanceBucket.Spent
  );
};
