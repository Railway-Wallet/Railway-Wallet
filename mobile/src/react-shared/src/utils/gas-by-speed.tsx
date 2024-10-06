import {
  EVMGasType,
  isDefined,
  NetworkName,
} from "@railgun-community/shared-models";
import { NetworkFeeSelection } from "../models";
import {
  GasDetails,
  GasDetailsBySpeed,
  GasHistoryPercentile,
} from "../models/gas";
import { getMedianBigInt, maxBigInt } from "./big-numbers";
import { getFeeHistory } from "./gas-fee-history";
import { getProviderGasPrice } from "./transactions";
import { gweiToWei } from "./util";

type SuggestedGasDetails = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

const gwei = (gwei: number) => {
  return gweiToWei(BigInt(gwei));
};

const getMinSuggestedGasPriceForNetwork = (
  networkName: NetworkName
): Optional<bigint> => {
  switch (networkName) {
    case NetworkName.BNBChain:
      return gwei(3);
    default:
      return undefined;
  }
};

const DEFAULT_SETTINGS_BY_PRIORITY_LEVEL = {
  [GasHistoryPercentile.Low]: {
    baseFeePercentageMultiplier: 105n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(1500000000),
  },
  [GasHistoryPercentile.Medium]: {
    baseFeePercentageMultiplier: 110n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(2500000000),
  },
  [GasHistoryPercentile.High]: {
    baseFeePercentageMultiplier: 115n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(3000000000),
  },
  [GasHistoryPercentile.VeryHigh]: {
    baseFeePercentageMultiplier: 125n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(4000000000),
  },
};

const BSC_SETTINGS_BY_PRIORITY_LEVEL = {
  [GasHistoryPercentile.Low]: {
    baseFeePercentageMultiplier: 105n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(1500000000),
  },
  [GasHistoryPercentile.Medium]: {
    baseFeePercentageMultiplier: 110n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(2500000000),
  },
  [GasHistoryPercentile.High]: {
    baseFeePercentageMultiplier: 115n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(3000000000),
  },
  [GasHistoryPercentile.VeryHigh]: {
    baseFeePercentageMultiplier: 125n,
    priorityFeePercentageMultiplier: 100n,
    minSuggestedMaxPriorityFeePerGas: BigInt(4000000000),
  },
};

let overrideSettingsByPriorityLevel_UNIT_TEST_ONLY: Optional<
  typeof DEFAULT_SETTINGS_BY_PRIORITY_LEVEL
>;
export const setOverrideSettingsByPriorityLevel_UNIT_TEST_ONLY = (
  overrideSettings: Optional<typeof DEFAULT_SETTINGS_BY_PRIORITY_LEVEL>
) => {
  overrideSettingsByPriorityLevel_UNIT_TEST_ONLY = overrideSettings;
};

const getSettingsByPriorityLevel = (networkName: NetworkName) => {
  if (isDefined(overrideSettingsByPriorityLevel_UNIT_TEST_ONLY)) {
    return overrideSettingsByPriorityLevel_UNIT_TEST_ONLY;
  }

  switch (networkName) {
    case NetworkName.BNBChain:
      return BSC_SETTINGS_BY_PRIORITY_LEVEL;
    case NetworkName.Ethereum:
    case NetworkName.Polygon:
    case NetworkName.Arbitrum:
    case NetworkName.PolygonAmoy:
    case NetworkName.EthereumSepolia:
    case NetworkName.ArbitrumGoerli_DEPRECATED:
    case NetworkName.PolygonMumbai_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.Hardhat:
    default:
      return DEFAULT_SETTINGS_BY_PRIORITY_LEVEL;
  }
};

export const broadcasterGasHistoryPercentileForChain = (
  networkName: NetworkName
): GasHistoryPercentile => {
  switch (networkName) {
    case NetworkName.Ethereum:
      return GasHistoryPercentile.Low;
    case NetworkName.Hardhat:
    case NetworkName.ArbitrumGoerli_DEPRECATED:
    case NetworkName.Arbitrum:
      return GasHistoryPercentile.Medium;
    case NetworkName.BNBChain:
    case NetworkName.Polygon:
    case NetworkName.PolygonAmoy:
    case NetworkName.EthereumRopsten_DEPRECATED:
    case NetworkName.EthereumGoerli_DEPRECATED:
    case NetworkName.EthereumSepolia:
      return GasHistoryPercentile.High;
    case NetworkName.PolygonMumbai_DEPRECATED:
      return GasHistoryPercentile.VeryHigh;
    default:
      return GasHistoryPercentile.Medium;
  }
};

export const gasPriceForPercentile = (
  networkName: NetworkName,
  gasPrice: bigint,
  percentile: GasHistoryPercentile
): bigint => {
  const settings = getSettingsByPriorityLevel(networkName)[percentile];
  const suggestedGasPrice = getMinSuggestedGasPriceForNetwork(networkName);
  let clampedGasPrice = gasPrice;
  if (isDefined(suggestedGasPrice)) {
    clampedGasPrice = maxBigInt(gasPrice, suggestedGasPrice);
  }
  return (clampedGasPrice * settings.baseFeePercentageMultiplier) / 100n;
};

const estimateGasPricesBySpeedUsingHeuristic = async (
  evmGasType: EVMGasType.Type0 | EVMGasType.Type1,
  networkName: NetworkName
): Promise<GasDetailsBySpeed> => {
  const gasPrice = await getProviderGasPrice(networkName);
  const gasPricesBySpeed: GasDetailsBySpeed = {
    [GasHistoryPercentile.Low]: {
      evmGasType,
      gasPrice: gasPriceForPercentile(
        networkName,
        gasPrice,
        GasHistoryPercentile.Low
      ),
    },
    [GasHistoryPercentile.Medium]: {
      evmGasType,
      gasPrice: gasPriceForPercentile(
        networkName,
        gasPrice,
        GasHistoryPercentile.Medium
      ),
    },
    [GasHistoryPercentile.High]: {
      evmGasType,
      gasPrice: gasPriceForPercentile(
        networkName,
        gasPrice,
        GasHistoryPercentile.High
      ),
    },
    [GasHistoryPercentile.VeryHigh]: {
      evmGasType,
      gasPrice: gasPriceForPercentile(
        networkName,
        gasPrice,
        GasHistoryPercentile.VeryHigh
      ),
    },
  };

  return gasPricesBySpeed;
};

const standardizedGasMaxFeesForMumbai = (
  evmGasType: EVMGasType.Type2
): GasDetailsBySpeed => {
  return {
    [GasHistoryPercentile.Low]: {
      evmGasType,
      maxFeePerGas: gwei(1),
      maxPriorityFeePerGas: gwei(1),
    },
    [GasHistoryPercentile.Medium]: {
      evmGasType,
      maxFeePerGas: gwei(2),
      maxPriorityFeePerGas: gwei(2),
    },
    [GasHistoryPercentile.High]: {
      evmGasType,
      maxFeePerGas: gwei(3),
      maxPriorityFeePerGas: gwei(3),
    },
    [GasHistoryPercentile.VeryHigh]: {
      evmGasType,
      maxFeePerGas: gwei(5),
      maxPriorityFeePerGas: gwei(5),
    },
  };
};

const estimateGasMaxFeesBySpeedUsingHeuristic = async (
  evmGasType: EVMGasType.Type2,
  networkName: NetworkName
): Promise<GasDetailsBySpeed> => {
  if (networkName === NetworkName.PolygonMumbai_DEPRECATED) {
    return standardizedGasMaxFeesForMumbai(evmGasType);
  }

  const feeHistory = await getFeeHistory(networkName);

  const mostRecentBaseFeePerGas: bigint = BigInt(
    feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1]
  );

  const priorityFeePercentile: {
    [percentile in GasHistoryPercentile]: bigint[];
  } = {
    [GasHistoryPercentile.Low]: feeHistory.reward.map((feePriorityGroup) =>
      BigInt(feePriorityGroup[0])
    ),
    [GasHistoryPercentile.Medium]: feeHistory.reward.map((feePriorityGroup) =>
      BigInt(feePriorityGroup[1])
    ),
    [GasHistoryPercentile.High]: feeHistory.reward.map((feePriorityGroup) =>
      BigInt(feePriorityGroup[2] ?? feePriorityGroup[1])
    ),
    [GasHistoryPercentile.VeryHigh]: feeHistory.reward.map((feePriorityGroup) =>
      BigInt(feePriorityGroup[3] ?? feePriorityGroup[2] ?? feePriorityGroup[1])
    ),
  };

  const priorityFeePercentileMedians: {
    [percentile in GasHistoryPercentile]: bigint;
  } = {
    [GasHistoryPercentile.Low]: getMedianBigInt(
      priorityFeePercentile[GasHistoryPercentile.Low]
    ),
    [GasHistoryPercentile.Medium]: getMedianBigInt(
      priorityFeePercentile[GasHistoryPercentile.Medium]
    ),
    [GasHistoryPercentile.High]: getMedianBigInt(
      priorityFeePercentile[GasHistoryPercentile.High]
    ),
    [GasHistoryPercentile.VeryHigh]: getMedianBigInt(
      priorityFeePercentile[GasHistoryPercentile.VeryHigh]
    ),
  };

  const suggestedGasDetails: {
    [percentile in GasHistoryPercentile]: SuggestedGasDetails;
  } = {
    [GasHistoryPercentile.Low]: getSuggestedGasDetails(
      gasPriceForPercentile(
        networkName,
        mostRecentBaseFeePerGas,
        GasHistoryPercentile.Low
      ),
      priorityFeePercentileMedians,
      GasHistoryPercentile.Low
    ),
    [GasHistoryPercentile.Medium]: getSuggestedGasDetails(
      gasPriceForPercentile(
        networkName,
        mostRecentBaseFeePerGas,
        GasHistoryPercentile.Medium
      ),
      priorityFeePercentileMedians,
      GasHistoryPercentile.Medium
    ),
    [GasHistoryPercentile.High]: getSuggestedGasDetails(
      gasPriceForPercentile(
        networkName,
        mostRecentBaseFeePerGas,
        GasHistoryPercentile.High
      ),
      priorityFeePercentileMedians,
      GasHistoryPercentile.High
    ),
    [GasHistoryPercentile.VeryHigh]: getSuggestedGasDetails(
      gasPriceForPercentile(
        networkName,
        mostRecentBaseFeePerGas,
        GasHistoryPercentile.VeryHigh
      ),
      priorityFeePercentileMedians,
      GasHistoryPercentile.VeryHigh
    ),
  };

  return {
    [GasHistoryPercentile.Low]: {
      evmGasType,
      ...suggestedGasDetails[GasHistoryPercentile.Low],
    },
    [GasHistoryPercentile.Medium]: {
      evmGasType,
      ...suggestedGasDetails[GasHistoryPercentile.Medium],
    },
    [GasHistoryPercentile.High]: {
      evmGasType,
      ...suggestedGasDetails[GasHistoryPercentile.High],
    },
    [GasHistoryPercentile.VeryHigh]: {
      evmGasType,
      ...suggestedGasDetails[GasHistoryPercentile.VeryHigh],
    },
  };
};

export const getGasDetailsBySpeed = async (
  evmGasType: EVMGasType,
  networkName: NetworkName
): Promise<GasDetailsBySpeed> => {
  switch (evmGasType) {
    case EVMGasType.Type0:
    case EVMGasType.Type1: {
      return estimateGasPricesBySpeedUsingHeuristic(evmGasType, networkName);
    }
    case EVMGasType.Type2: {
      return estimateGasMaxFeesBySpeedUsingHeuristic(evmGasType, networkName);
    }
  }
};

const getSuggestedGasDetails = (
  baseFeesMedian: bigint,
  priorityFeePercentileMedians: {
    [percentile in GasHistoryPercentile]: bigint;
  },
  percentile: GasHistoryPercentile
): SuggestedGasDetails => {
  const maxBaseFeePerGas = baseFeesMedian;
  const maxPriorityFeePerGas = priorityFeePercentileMedians[percentile];

  return {
    maxPriorityFeePerGas,
    maxFeePerGas: maxBaseFeePerGas + maxPriorityFeePerGas,
  };
};

export const convertNetworkFeeSelectionToGasSpeed = (
  networkFeeSelection: NetworkFeeSelection
): Optional<GasHistoryPercentile> => {
  switch (networkFeeSelection) {
    case NetworkFeeSelection.Slower:
      return GasHistoryPercentile.Low;
    case NetworkFeeSelection.Standard:
      return GasHistoryPercentile.Medium;
    case NetworkFeeSelection.Faster:
      return GasHistoryPercentile.High;
    case NetworkFeeSelection.Aggressive:
      return GasHistoryPercentile.VeryHigh;
    case NetworkFeeSelection.Custom:
      return undefined;
  }
};

export const extractGasValue = (gasDetails: GasDetails): bigint => {
  switch (gasDetails.evmGasType) {
    case EVMGasType.Type0:
    case EVMGasType.Type1: {
      return gasDetails.gasPrice;
    }
    case EVMGasType.Type2: {
      return gasDetails.maxFeePerGas;
    }
  }
};
