import {
  isDefined,
  Network,
  RailgunERC20Amount,
  RailgunHistoryReceiveERC20Amount,
  RailgunHistoryUnshieldERC20Amount,
  TransactionHistoryItemCategory,
} from "@railgun-community/shared-models";
import { formatUnits } from "ethers";
import { ReactConfig } from "../config/react-config";
import { SharedConstants } from "../config/shared-constants";
import {
  KoinlyExportERC20Info,
  KoinlyTransaction,
  KoinlyTransactionLabel,
  RailgunERC20AmountWithMemoText,
  TransactionHistoryItemWithReceiptData,
  TransactionNFTAmountWithMemoText,
  TransactionSentReceivedSingleERC20,
} from "../models/transaction";
import { FrontendWallet } from "../models/wallet";
import { getCoingeckoTokenDetails } from "../services/api/coingecko/coingecko-token";
import { getERC20Decimals } from "../services/token/erc20";
import { logDevError } from "./logging";
import { getNFTAmountDisplayName } from "./nft";
import { compareTokenAddress, createSerializedNFTAmount } from "./tokens";
import { truncateStr } from "./util";

const padDateNumber = (num: number): string => {
  return num < 10 ? `0${num}` : num.toString();
};

export const timestampToUTC = (timestamp: number): string => {
  if (timestamp === SharedConstants.TIMESTAMP_MISSING_VALUE) {
    return "Unknown date";
  }
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = padDateNumber(date.getUTCMonth() + 1);
  const day = padDateNumber(date.getUTCDate());
  const hours = padDateNumber(date.getUTCHours());
  const minutes = padDateNumber(date.getUTCMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
};

const amountForUnshield = (
  unshieldERC20Amount: RailgunHistoryUnshieldERC20Amount
): bigint => {
  return (
    unshieldERC20Amount.amount - BigInt(unshieldERC20Amount.unshieldFee ?? "0")
  );
};

const amountForShield = (
  receiveERC20Amount: RailgunHistoryReceiveERC20Amount
): bigint => {
  return (
    receiveERC20Amount.amount - BigInt(receiveERC20Amount.shieldFee ?? "0")
  );
};

const getTokenSymbol = async (
  network: Network,
  tokenAddress: string
): Promise<string> => {
  try {
    const tokenData = await getCoingeckoTokenDetails(network, tokenAddress);
    return tokenData.symbol.toUpperCase();
  } catch (err) {
    logDevError(err);
    return tokenAddress;
  }
};

const getTokenDecimals = async (
  network: Network,
  tokenAddress: string
): Promise<number> => {
  try {
    const decimals = Number(await getERC20Decimals(network.name, tokenAddress));
    return decimals;
  } catch (err) {
    logDevError(err);
    throw new Error("Could not get token decimals");
  }
};

const EMPTY_ERC20_TOKEN_INFO: KoinlyExportERC20Info = {
  symbol: "",
  amount: "",
};

const getERC20InfoForKoinly = async (
  wallet: Optional<FrontendWallet>,
  network: Network,
  tokenAddress: string,
  amount: bigint
): Promise<KoinlyExportERC20Info> => {
  const addedTokens = wallet?.addedTokens[network.name] ?? [];
  const foundToken = addedTokens
    .filter((token) => !(token.isBaseToken ?? false))
    .find((token) => compareTokenAddress(token.address, tokenAddress));

  let decimals;
  let symbol = tokenAddress;
  if (foundToken) {
    decimals = foundToken.decimals;
    symbol = foundToken.symbol;
  } else {
    decimals = await getTokenDecimals(network, tokenAddress);
    symbol = await getTokenSymbol(network, tokenAddress);
  }

  return {
    symbol,
    amount: formatUnits(amount, decimals),
  };
};

const getReceivedERC20InfoForKoinly = async (
  wallet: Optional<FrontendWallet>,
  network: Network,
  tokenAddress: Optional<string>,
  amount: Optional<bigint>
): Promise<KoinlyExportERC20Info> => {
  if (
    !isDefined(tokenAddress) ||
    tokenAddress === "" ||
    !isDefined(amount) ||
    amount === 0n
  ) {
    return EMPTY_ERC20_TOKEN_INFO;
  }

  const receivedERC20Info = await getERC20InfoForKoinly(
    wallet,
    network,
    tokenAddress,
    amount
  );

  return receivedERC20Info;
};

const getSentERC20InfoForKoinly = async (
  wallet: Optional<FrontendWallet>,
  network: Network,
  tokenAddress: Optional<string>,
  amount: Optional<bigint>
): Promise<KoinlyExportERC20Info> => {
  if (
    !isDefined(tokenAddress) ||
    tokenAddress === "" ||
    !isDefined(amount) ||
    amount === 0n
  ) {
    return EMPTY_ERC20_TOKEN_INFO;
  }

  const sentERC20Info = await getERC20InfoForKoinly(
    wallet,
    network,
    tokenAddress,
    amount
  );

  return sentERC20Info;
};

const getFeeERC20InfoForKoinly = async (
  wallet: Optional<FrontendWallet>,
  network: Network,
  shouldAddTokenFee: boolean,
  broadcasterFeeERC20Amount: Optional<RailgunERC20Amount>,
  gasFeeString: Optional<string>
): Promise<KoinlyExportERC20Info> => {
  if (shouldAddTokenFee) {
    if (broadcasterFeeERC20Amount) {
      const feeERC20Info = await getERC20InfoForKoinly(
        wallet,
        network,
        broadcasterFeeERC20Amount.tokenAddress,
        broadcasterFeeERC20Amount.amount
      );

      return feeERC20Info;
    }
    if (isDefined(gasFeeString) && gasFeeString !== "") {
      return {
        symbol: network.baseToken.symbol,
        amount: formatUnits(BigInt(gasFeeString), network.baseToken.decimals),
      };
    }
  }

  return EMPTY_ERC20_TOKEN_INFO;
};

const createDescriptionText = (
  memoText: Optional<string>,
  category: TransactionHistoryItemCategory,
  isFirstRowForTransaction: boolean
): string => {
  if (!isFirstRowForTransaction) {
    return "";
  }
  const memoWithDevPrefix = ReactConfig.IS_DEV
    ? `[${category}]: ${memoText ?? ""}`
    : memoText;
  const description = truncateStr(memoWithDevPrefix, 100) ?? "";
  return description;
};

const createKoinlyTransactionSent = async (
  network: Network,
  transaction: TransactionHistoryItemWithReceiptData,
  wallet: Optional<FrontendWallet>,
  sentERC20: RailgunERC20AmountWithMemoText,
  label: KoinlyTransactionLabel,
  isFirstRowForToken: boolean,
  shouldAddTokenFee: boolean
) => {
  const { timestamp, txid, broadcasterFeeERC20Amount, gasFeeString } =
    transaction;
  const { amount, tokenAddress, memoText } = sentERC20;

  const description = createDescriptionText(
    memoText,
    transaction.category,
    isFirstRowForToken
  );

  const sentERC20Info = await getSentERC20InfoForKoinly(
    wallet,
    network,
    tokenAddress,
    amount
  );

  const feeERC20Info = await getFeeERC20InfoForKoinly(
    wallet,
    network,
    shouldAddTokenFee,
    broadcasterFeeERC20Amount,
    gasFeeString
  );

  const koinlyTransaction: KoinlyTransaction = {
    receivedAmount: "",
    receivedCurrency: "",
    sentAmount: sentERC20Info.amount,
    sentCurrency: sentERC20Info.symbol,
    feeAmount: feeERC20Info.amount,
    feeCurrency: feeERC20Info.symbol,
    utcDate: timestampToUTC(timestamp),
    description,
    label,
    hash: txid,
    network: network.publicName,
  };

  return koinlyTransaction;
};

const createKoinlyTransactionReceived = async (
  network: Network,
  transaction: TransactionHistoryItemWithReceiptData,
  wallet: Optional<FrontendWallet>,
  sentERC20: RailgunERC20AmountWithMemoText,
  label: KoinlyTransactionLabel,
  isFirstRowForToken: boolean,
  shouldAddTokenFee: boolean
) => {
  const { timestamp, txid, broadcasterFeeERC20Amount, gasFeeString } =
    transaction;
  const { amount, tokenAddress, memoText } = sentERC20;

  const description = createDescriptionText(
    memoText,
    transaction.category,
    isFirstRowForToken
  );

  const receivedERC20Info = await getReceivedERC20InfoForKoinly(
    wallet,
    network,
    tokenAddress,
    amount
  );

  const feeERC20Info = await getFeeERC20InfoForKoinly(
    wallet,
    network,
    shouldAddTokenFee,
    broadcasterFeeERC20Amount,
    gasFeeString
  );

  const koinlyTransaction: KoinlyTransaction = {
    receivedAmount: receivedERC20Info.amount,
    receivedCurrency: receivedERC20Info.symbol,
    sentAmount: "",
    sentCurrency: "",
    feeAmount: feeERC20Info.amount,
    feeCurrency: feeERC20Info.symbol,
    utcDate: timestampToUTC(timestamp),
    description,
    label,
    hash: txid,
    network: network.publicName,
  };

  return koinlyTransaction;
};

const createKoinlyTransactionNFT = async (
  network: Network,
  transaction: TransactionHistoryItemWithReceiptData,
  wallet: Optional<FrontendWallet>,
  nftAmountWithMemoText: TransactionNFTAmountWithMemoText,
  isSent: boolean,
  label: KoinlyTransactionLabel,
  isFirstRowForTransaction: boolean,
  shouldAddTokenFee: boolean
): Promise<KoinlyTransaction> => {
  const { timestamp, txid, broadcasterFeeERC20Amount, gasFeeString } =
    transaction;
  const { amountString, memoText } = nftAmountWithMemoText;

  const description = createDescriptionText(
    memoText,
    transaction.category,
    isFirstRowForTransaction
  );

  const feeERC20Info = await getFeeERC20InfoForKoinly(
    wallet,
    network,
    shouldAddTokenFee,
    broadcasterFeeERC20Amount,
    gasFeeString
  );

  const nftDisplayName = getNFTAmountDisplayName(
    nftAmountWithMemoText,
    false,
    true
  );

  const amountDecimal = BigInt(amountString).toString();

  const koinlyTransaction: KoinlyTransaction = {
    receivedAmount: !isSent ? amountDecimal : "",
    receivedCurrency: !isSent ? nftDisplayName : "",
    sentAmount: isSent ? amountDecimal : "",
    sentCurrency: isSent ? nftDisplayName : "",
    feeAmount: feeERC20Info.amount,
    feeCurrency: feeERC20Info.symbol,
    utcDate: timestampToUTC(timestamp),
    description,
    label,
    hash: txid,
    network: network.publicName,
  };

  return koinlyTransaction;
};

const labelForTransaction = (
  transaction: TransactionHistoryItemWithReceiptData
) => {
  switch (transaction.category) {
    case TransactionHistoryItemCategory.ShieldERC20s:
    case TransactionHistoryItemCategory.UnshieldERC20s:
    case TransactionHistoryItemCategory.TransferSendERC20s:
    case TransactionHistoryItemCategory.TransferReceiveERC20s:
      return KoinlyTransactionLabel.RegularDepositWithdrawalTrade;
    case TransactionHistoryItemCategory.Unknown:
      return KoinlyTransactionLabel.RegularDepositWithdrawalTrade;
  }
};

export const createKoinlyTransactionsForTransactionHistoryItem = async (
  network: Network,
  transaction: TransactionHistoryItemWithReceiptData,
  wallet: Optional<FrontendWallet>
): Promise<KoinlyTransaction[]> => {
  const { transferERC20Amounts, receiveERC20Amounts, unshieldERC20Amounts } =
    transaction;

  const sentReceivedERC20Map: MapType<TransactionSentReceivedSingleERC20> = {};

  receiveERC20Amounts.forEach((receiveERC20Amount) => {
    const { tokenAddress, amount, shieldFee, memoText } = receiveERC20Amount;
    if (!isDefined(sentReceivedERC20Map[tokenAddress])) {
      sentReceivedERC20Map[tokenAddress] = { received: [], sent: [] };
    }

    sentReceivedERC20Map?.[tokenAddress]?.received.push({
      tokenAddress,
      amount: isDefined(shieldFee)
        ? amountForShield(receiveERC20Amount)
        : amount,
      memoText,
    });
  });

  transferERC20Amounts.forEach((transferERC20Amount) => {
    const { tokenAddress, amount, memoText } = transferERC20Amount;
    if (!isDefined(sentReceivedERC20Map[tokenAddress])) {
      sentReceivedERC20Map[tokenAddress] = { received: [], sent: [] };
    }

    sentReceivedERC20Map?.[tokenAddress]?.sent.push({
      tokenAddress,
      amount,
      memoText,
    });
  });

  unshieldERC20Amounts.forEach((unshieldERC20Amount) => {
    const { tokenAddress, memoText } = unshieldERC20Amount;
    if (!isDefined(sentReceivedERC20Map[tokenAddress])) {
      sentReceivedERC20Map[tokenAddress] = { received: [], sent: [] };
    }

    sentReceivedERC20Map?.[tokenAddress]?.sent.push({
      tokenAddress,
      amount: amountForUnshield(unshieldERC20Amount),
      memoText,
    });
  });

  const tokenAddresses: string[] = Object.keys(sentReceivedERC20Map);

  const label = labelForTransaction(transaction);

  const koinlyTransactionsERC20s: KoinlyTransaction[][] = await Promise.all(
    tokenAddresses.map(async (tokenAddress, index) => {
      const isFirstRowForTransaction = index === 0;
      let hasAddedSentRow = false;

      const sentReceivedERC20 = sentReceivedERC20Map[tokenAddress];
      const sentERC20: RailgunERC20AmountWithMemoText[] =
        sentReceivedERC20?.sent ?? [];
      const receivedERC20: RailgunERC20AmountWithMemoText[] =
        sentReceivedERC20?.received ?? [];

      const sentKoinlyTransaction = await Promise.all(
        sentERC20.map((sentERC20, index) => {
          const isFirstRowForToken = index === 0 && isFirstRowForTransaction;
          const shouldAddTokenFee = isFirstRowForToken;
          hasAddedSentRow = true;

          return createKoinlyTransactionSent(
            network,
            transaction,
            wallet,
            sentERC20,
            label,
            isFirstRowForToken,
            shouldAddTokenFee
          );
        })
      );

      const isPrivateReceiveOnly =
        transaction.category ===
        TransactionHistoryItemCategory.TransferReceiveERC20s;

      const receivedKoinlyTransaction = await Promise.all(
        receivedERC20.map((receivedERC20) => {
          const isFirstRowForToken =
            index === 0 && isFirstRowForTransaction && !hasAddedSentRow;
          const shouldAddTokenFee = isFirstRowForToken && !isPrivateReceiveOnly;

          return createKoinlyTransactionReceived(
            network,
            transaction,
            wallet,
            receivedERC20,
            label,
            isFirstRowForToken,
            shouldAddTokenFee
          );
        })
      );

      return [...sentKoinlyTransaction, ...receivedKoinlyTransaction];
    })
  );

  const nftsSent: TransactionNFTAmountWithMemoText[] =
    transaction.transferNFTAmounts.map((nftAmount) => ({
      ...createSerializedNFTAmount(nftAmount),
      memoText: nftAmount.memoText,
    }));
  const nftsReceived: TransactionNFTAmountWithMemoText[] = [
    ...transaction.receiveNFTAmounts.map((nftAmount) => ({
      ...createSerializedNFTAmount(nftAmount),
      memoText: nftAmount.memoText,
    })),
    ...transaction.unshieldNFTAmounts.map((nftAmount) => ({
      ...createSerializedNFTAmount(nftAmount),
      memoText: nftAmount.memoText,
    })),
  ];
  const koinlyTransactionsNFTsSent: KoinlyTransaction[] = await Promise.all(
    nftsSent.map((nftAmountWithMemoText, index) => {
      const isFirstRowForTransaction = index === 0;
      const shouldAddTokenFee = isFirstRowForTransaction;
      return createKoinlyTransactionNFT(
        network,
        transaction,
        wallet,
        nftAmountWithMemoText,
        true,
        label,
        isFirstRowForTransaction,
        shouldAddTokenFee
      );
    })
  );

  const isPrivateReceiveOnly = nftsSent.length === 0 && nftsReceived.length > 0;

  const koinlyTransactionsNFTsReceived: KoinlyTransaction[] = await Promise.all(
    nftsReceived.map((nftAmountWithMemoText, index) => {
      const isFirstRowForTransaction = index === 0;
      const shouldAddTokenFee =
        isFirstRowForTransaction && !isPrivateReceiveOnly;
      return createKoinlyTransactionNFT(
        network,
        transaction,
        wallet,
        nftAmountWithMemoText,
        false,
        label,
        isFirstRowForTransaction,
        shouldAddTokenFee
      );
    })
  );

  return [
    ...koinlyTransactionsERC20s.flat(),
    ...koinlyTransactionsNFTsSent,
    ...koinlyTransactionsNFTsReceived,
  ];
};
