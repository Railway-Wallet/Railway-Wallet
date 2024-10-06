import {
  ChainType,
  isDefined,
  Network,
  NETWORK_CONFIG,
  NetworkName,
  promiseTimeout,
} from "@railgun-community/shared-models";
import { Block, Provider } from "ethers";
import { ReactConfig } from "../config";
import { ProviderNodeType } from "../models";
import { ProviderService } from "../services/providers/provider-service";
import { logDevError } from "./logging";
import { networkForName } from "./networks";

type BlockTimestamp = {
  blockNumber: number;
  timestamp: number;
};

const getRangeFromTimestamp = (timestamp: number) => {
  const oneDay = 24 * 60 * 60;
  const rangeStartTimestamp = timestamp - oneDay * 7;
  const rangeEndTimestamp = timestamp - oneDay;

  return { rangeStartTimestamp, rangeEndTimestamp };
};

export const getBlockFromTimestamp = async (
  networkName: NetworkName,
  timestamp: number
): Promise<number> => {
  const fullNodeProvider = await ProviderService.getProvider(
    networkName,
    ProviderNodeType.FullNode
  );
  return await getBlockFromTimestampWithProvider(
    fullNodeProvider,
    networkName,
    timestamp
  );
};

const getBlockFromTimestampWithProvider = async (
  provider: Provider,
  networkName: NetworkName,
  timestamp: number
): Promise<number> => {
  const network = networkForName(networkName);
  if (!network) {
    throw new Error("Invalid network name");
  }

  const { deploymentBlock } = network;
  const deploymentBlockTimestamp = await getTimestampFromBlock(
    provider,
    deploymentBlock
  );
  if (deploymentBlockTimestamp == null) {
    throw new Error("Deployment block timestamp is null");
  }

  const currentBlock = await getCurrentBlock(networkName);
  if (currentBlock == null) {
    throw new Error("Could not find current block data");
  }
  const currentBlockNumber = currentBlock.number;
  const currentBlockTimestamp = currentBlock.timestamp;

  const { rangeStartTimestamp, rangeEndTimestamp } =
    getRangeFromTimestamp(timestamp);

  if (deploymentBlockTimestamp > rangeEndTimestamp) {
    throw new Error("Deployment block timestamp is after range end timestamp");
  }

  if (currentBlockTimestamp < rangeStartTimestamp) {
    throw new Error("Current block timestamp is before range start timestamp");
  }

  const startBlockTimestamp = {
    blockNumber: deploymentBlock,
    timestamp: deploymentBlockTimestamp,
  };
  const endBlockTimestamp = {
    blockNumber: currentBlockNumber,
    timestamp: currentBlockTimestamp,
  };

  return getBlockNumberWithinTimestampRange(
    provider,
    startBlockTimestamp,
    endBlockTimestamp,
    rangeStartTimestamp,
    rangeEndTimestamp
  );
};

export const getTimestampFromBlock = async (
  provider: Provider,
  blockNumber: number
): Promise<Optional<number>> => {
  const block = await provider.getBlock(blockNumber);
  return block?.timestamp;
};

const networkSupportsEVMBlockNumber = (network: Network) => {
  if (network.deprecated ?? false) {
    return false;
  }
  switch (network.chain.type) {
    case ChainType.EVM:
      return true;
  }
};

export const getCurrentBlock = async (
  networkName: NetworkName
): Promise<Optional<Block>> => {
  try {
    const provider = await ProviderService.getProvider(networkName);
    const block = await promiseTimeout(provider.getBlock("latest"), 5000);
    return block ?? undefined;
  } catch (err) {
    return getRecentBlockFromNumberLookup(networkName);
  }
};

const getRecentBlockFromNumberLookup = async (
  networkName: NetworkName
): Promise<Optional<Block>> => {
  try {
    const provider = await ProviderService.getProvider(networkName);
    const blockNumber = await promiseTimeout(provider.getBlockNumber(), 5000);

    const recentBlockNumber = blockNumber - 100;
    const block = await promiseTimeout(
      provider.getBlock(recentBlockNumber),
      5000
    );
    return block ?? undefined;
  } catch (error) {
    return undefined;
  }
};

export const getCurrentBlockNumber = async (
  networkName: NetworkName
): Promise<number> => {
  const block = await getCurrentBlock(networkName);
  if (!isDefined(block)) {
    throw new Error("Block is null");
  }
  return block.number;
};

export const getBlockNumbersForAllNetworks = async (
  timestamp?: number
): Promise<MapType<number>> => {
  const creationBlockNumbers: MapType<number> = {};

  await Promise.all(
    Object.values(NETWORK_CONFIG).map(async (network) => {
      if (network.name === NetworkName.Hardhat) {
        return Promise.resolve();
      }
      if (network.isDevOnlyNetwork === true && !ReactConfig.IS_DEV) {
        return Promise.resolve();
      }
      if (!networkSupportsEVMBlockNumber(network)) {
        return Promise.resolve();
      }

      try {
        const blockNumber = isDefined(timestamp)
          ? await getBlockFromTimestamp(network.name, timestamp)
          : await getCurrentBlockNumber(network.name);
        creationBlockNumbers[network.name] = blockNumber;
      } catch {
        logDevError(`Failed to get current block for ${network.name}.`);
        return Promise.resolve();
      }
    })
  );

  return creationBlockNumbers;
};

const getBlockNumberWithinTimestampRange = async (
  provider: Provider,
  startBlockTimestamp: BlockTimestamp,
  endBlockTimestamp: BlockTimestamp,
  rangeStartTimestamp: number,
  rangeEndTimestamp: number,
  iterationCount = 0
): Promise<number> => {
  if (iterationCount > 12) {
    throw new Error("Too many iterations");
  }

  const middleBlockNumber = Math.floor(
    (startBlockTimestamp.blockNumber + endBlockTimestamp.blockNumber) / 2
  );

  const middleBlockTimestamp = await getTimestampFromBlock(
    provider,
    middleBlockNumber
  );
  if (middleBlockTimestamp == null) {
    throw new Error("Middle block timestamp is null");
  }

  if (middleBlockTimestamp > rangeEndTimestamp) {
    return getBlockNumberWithinTimestampRange(
      provider,
      startBlockTimestamp,
      {
        blockNumber: middleBlockNumber,
        timestamp: middleBlockTimestamp,
      },
      rangeStartTimestamp,
      rangeEndTimestamp,
      iterationCount + 1
    );
  }

  if (middleBlockTimestamp < rangeStartTimestamp) {
    return getBlockNumberWithinTimestampRange(
      provider,
      {
        blockNumber: middleBlockNumber,
        timestamp: middleBlockTimestamp,
      },
      endBlockTimestamp,
      rangeStartTimestamp,
      rangeEndTimestamp,
      iterationCount + 1
    );
  }

  return middleBlockNumber;
};
