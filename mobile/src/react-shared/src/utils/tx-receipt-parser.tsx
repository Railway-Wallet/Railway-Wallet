import { isDefined } from "@railgun-community/shared-models";
import { Interface, isAddress, TransactionReceipt } from "ethers";
import { ERC20Amount } from "../models/token";
import { TransactionReceiptTransfer } from "../models/transaction";
import { trimAddress } from "./address";
import { logDevError } from "./logging";
import { compareTokenAddress } from "./tokens";
import { absBigInt } from "./util";

export const formatTransactionAddress = (
  address: Optional<string>
): Optional<string> => {
  if (!isDefined(address) || typeof address !== "string") return;

  const trimmedAddress = trimAddress(address, 20);
  if (!isAddress(trimmedAddress)) return;

  return trimmedAddress;
};

export const formatTransfersFromTxReceipt = (
  txReceipt: TransactionReceipt
): Promise<TransactionReceiptTransfer[]> => {
  const transfers: TransactionReceiptTransfer[] = [];
  const transferABI = [
    "event Transfer(address indexed from, address indexed to, uint value)",
  ];
  const transferInterface = new Interface(transferABI);
  const { logs } = txReceipt;
  logs.forEach((log) => {
    try {
      const parsedLog = transferInterface.parseLog(log as any);
      if (parsedLog?.name === "Transfer") {
        const { args } = parsedLog;
        const amount = args.value;
        const tokenAddress = log.address;
        const fromAddress = args.from;
        const toAddress = args.to;

        if (
          isDefined(amount) &&
          isDefined(tokenAddress) &&
          isDefined(fromAddress) &&
          isDefined(toAddress)
        ) {
          transfers.push({
            amount,
            tokenAddress,
            fromAddress,
            toAddress,
          });
        }
      }
      // eslint-disable-next-line no-empty
    } catch {}
  });

  return Promise.resolve(transfers);
};

export const findTokenTransferAmountFromReceipt = async (
  txReceipt: TransactionReceipt,
  tokenAmount: ERC20Amount,
  walletAddress: string,
  isPrivate: boolean
): Promise<Optional<ERC20Amount>> => {
  try {
    const transfers = await formatTransfersFromTxReceipt(txReceipt);

    let transferAmount: Optional<bigint>;

    if (isPrivate) {
      transferAmount = findClosestMatchingTransferAmount(
        tokenAmount,
        transfers
      );
    } else {
      transferAmount = findTotalTransferredToAddress(
        tokenAmount,
        walletAddress,
        transfers
      );
    }

    if (isDefined(transferAmount)) {
      return {
        token: tokenAmount.token,
        amountString: transferAmount.toString(),
      };
    }
  } catch (err) {
    if (!(err instanceof Error)) {
      throw err;
    }
    logDevError(
      new Error(`Error in findTokenTransferAmountFromReceipt`, { cause: err })
    );
  }

  return undefined;
};

const findClosestMatchingTransferAmount = (
  tokenAmount: ERC20Amount,
  transfers: TransactionReceiptTransfer[]
): Optional<bigint> => {
  const estimatedTransferAmount = BigInt(tokenAmount.amountString);

  let lowestDelta: bigint;
  let closestTransferAmount: Optional<bigint>;

  transfers.forEach((transfer) => {
    if (compareTokenAddress(transfer.tokenAddress, tokenAmount.token.address)) {
      const delta = absBigInt(estimatedTransferAmount - transfer.amount);
      if (!lowestDelta || delta < lowestDelta) {
        lowestDelta = delta;
        closestTransferAmount = transfer.amount;
      }
    }
  });

  return closestTransferAmount;
};

const findTotalTransferredToAddress = (
  tokenAmount: ERC20Amount,
  walletAddress: string,
  transfers: TransactionReceiptTransfer[]
) => {
  let totalTransferred = 0n;

  transfers.forEach((transfer) => {
    if (
      compareTokenAddress(transfer.tokenAddress, tokenAmount.token.address) &&
      transfer.toAddress.toLowerCase() === walletAddress.toLowerCase()
    ) {
      totalTransferred = totalTransferred + transfer.amount;
    }
  });

  if (totalTransferred === 0n) {
    return undefined;
  }
  return totalTransferred;
};
