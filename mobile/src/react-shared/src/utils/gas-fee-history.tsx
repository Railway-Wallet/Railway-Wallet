import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { JsonRpcProvider } from "ethers";
import { FeeHistoryPercentile, FeeHistoryResult } from "../models/gas";
import { ProviderService } from "../services/providers/provider-service";
import { logDev, logDevError } from "./logging";

const HISTORICAL_BLOCK_COUNT = 10;
const REWARD_PERCENTILES: number[] = [
  FeeHistoryPercentile.Low,
  FeeHistoryPercentile.Medium,
  FeeHistoryPercentile.High,
  FeeHistoryPercentile.VeryHigh,
];

export const getHistoricalBlockCountForNetwork = (
  networkName: NetworkName
): number => {
  if (networkName === NetworkName.Ethereum) {
    return 20;
  }
  if (networkName === NetworkName.Polygon) {
    return 40;
  }
  return HISTORICAL_BLOCK_COUNT;
};

const findHeadBlockInMessage = (message: string): Optional<number> => {
  try {
    const headBlockInMessageSplit = message.split(", head ");
    if (headBlockInMessageSplit.length === 2) {
      const headBlock = parseInt(headBlockInMessageSplit[1], 10);
      if (!Number.isNaN(headBlock)) {
        return headBlock;
      }
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
};

export const getFeeHistory = async (
  networkName: NetworkName,
  recentBlock?: number,
  retryCount = 0
): Promise<FeeHistoryResult> => {
  const provider = await ProviderService.getProvider(networkName);
  try {
    const firstJsonRpcProvider = provider.providerConfigs[0]
      .provider as JsonRpcProvider;

    return (await firstJsonRpcProvider.send("eth_feeHistory", [
      HISTORICAL_BLOCK_COUNT,
      recentBlock ?? "latest",
      REWARD_PERCENTILES,
    ])) as FeeHistoryResult;
  } catch (err) {
    const error = new Error("Error getting fee history", { cause: err });
    logDevError(error);

    if (!(err instanceof Error)) {
      throw err;
    }
    if (err.message && err.message.includes("request beyond head block")) {
      if (retryCount > 5) {
        throw new Error(
          "Recent on-chain fee history not available. Please refresh and try again."
        );
      }
      const headBlock = findHeadBlockInMessage(err.message);
      if (isDefined(headBlock)) {
        logDev(
          `Request beyond head block: trying extracted head block ${headBlock}`
        );
        return getFeeHistory(networkName, headBlock, retryCount + 1);
      }

      if (!isDefined(recentBlock)) {
        const latestBlock = await provider.getBlock("latest");
        if (!latestBlock) {
          throw new Error("Could not get latest block");
        }
        recentBlock = latestBlock.number - 1;
      }
      logDev(
        `Request beyond head block: trying previous block ${recentBlock - 1}`
      );
      return getFeeHistory(networkName, recentBlock - 1, retryCount + 1);
    }
    throw error;
  }
};
