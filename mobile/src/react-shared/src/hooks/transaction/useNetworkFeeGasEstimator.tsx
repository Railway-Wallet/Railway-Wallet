import { RecipeOutput } from "@railgun-community/cookbook";
import {
  EVMGasType,
  FeeTokenDetails,
  getEVMGasTypeForTransaction,
  isDefined,
  NFTAmountRecipient,
  SelectedBroadcaster,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SharedConstants } from "../../config/shared-constants";
import {
  GetGasEstimateProofRequired,
  GetGasEstimateSelfSigned,
} from "../../models/callbacks";
import { GasDetailsBySpeed, GasHistoryPercentile } from "../../models/gas";
import { NetworkFeeSelection } from "../../models/network";
import { ERC20AmountRecipient } from "../../models/token";
import { ProgressService } from "../../services";
import { promiseTimeout } from "../../utils";
import {
  broadcasterGasHistoryPercentileForChain,
  convertNetworkFeeSelectionToGasSpeed,
  extractGasValue,
  getGasDetailsBySpeed,
} from "../../utils/gas-by-speed";
import { logDev, logDevError } from "../../utils/logging";
import { networkGasText } from "../../utils/transactions";
import { generateKey, valuesWithinThresholdBigNumber } from "../../utils/util";
import { useGasTokenBalanceError } from "../alerts/useGasTokenBalanceError";
import { useReduxSelector } from "../hooks-redux";

export type GasDetailsMap = Record<NetworkFeeSelection, TransactionGasDetails>;

export type CustomGasTransactionDetails = {
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
};

export const useNetworkFeeGasEstimator = (
  getGasEstimate: GetGasEstimateSelfSigned | GetGasEstimateProofRequired,
  requiresProofGeneration: boolean,
  isShieldedFromAddress: boolean,
  memoText: Optional<string>,
  erc20AmountRecipients: ERC20AmountRecipient[],
  nftAmountRecipients: NFTAmountRecipient[],
  customGasTransactionDetails: CustomGasTransactionDetails,
  selectedBroadcasterLocked: Optional<boolean>,
  selectedBroadcaster: Optional<SelectedBroadcaster>,
  sendWithPublicWallet: boolean,
  isMounted: () => boolean,
  gasEstimateProgressCallback: (progress: number) => void,
  selectedFeeTokenAddress: string,
  recipeOutput: Optional<RecipeOutput>
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");
  const { remoteConfig } = useReduxSelector("remoteConfig");
  const { txidVersion } = useReduxSelector("txidVersion");

  const railWalletID = wallets.active?.railWalletID;

  const pollGasFeeData = useRef<() => Promise<void>>();

  const progressServiceGasEstimate = useRef<Optional<ProgressService>>();

  const [networkFeeSelection, setNetworkFeeSelection] = useState(
    NetworkFeeSelection.Standard
  );

  const [gasDetailsBySpeed, setGasDetailsBySpeed] =
    useState<Optional<GasDetailsBySpeed>>();

  const [gasEstimate, setGasEstimate] = useState<Optional<bigint>>();

  const [gasEstimateError, setGasEstimateError] = useState<Optional<Error>>();

  const latestGasEstimateID = useRef<Optional<string>>();
  const latestSelectedBroadcasterLocked = useRef<Optional<boolean>>(
    selectedBroadcasterLocked
  );

  const validGasDetailsForNetworkFeeSelection = useCallback(
    (feeSelection: NetworkFeeSelection): Optional<TransactionGasDetails> => {
      if (!gasDetailsBySpeed) {
        return undefined;
      }
      if (!isDefined(gasEstimate)) {
        return undefined;
      }
      if (!isMounted()) {
        return undefined;
      }

      const evmGasType = getEVMGasTypeForTransaction(
        network.current.name,
        sendWithPublicWallet
      );

      switch (feeSelection) {
        case NetworkFeeSelection.Slower: {
          return {
            gasEstimate,
            ...gasDetailsBySpeed[GasHistoryPercentile.Low],
          };
        }
        case NetworkFeeSelection.Standard: {
          return {
            gasEstimate,
            ...gasDetailsBySpeed[GasHistoryPercentile.Medium],
          };
        }
        case NetworkFeeSelection.Faster: {
          return {
            gasEstimate,
            ...gasDetailsBySpeed[GasHistoryPercentile.High],
          };
        }
        case NetworkFeeSelection.Aggressive: {
          return {
            gasEstimate,
            ...gasDetailsBySpeed[GasHistoryPercentile.VeryHigh],
          };
        }
        case NetworkFeeSelection.Custom: {
          switch (evmGasType) {
            case EVMGasType.Type0:
            case EVMGasType.Type1:
              if (isDefined(customGasTransactionDetails?.gasPrice)) {
                return {
                  evmGasType,
                  gasEstimate,
                  gasPrice: customGasTransactionDetails.gasPrice,
                };
              }
              break;
            case EVMGasType.Type2:
              if (
                isDefined(customGasTransactionDetails?.maxFeePerGas) &&
                isDefined(customGasTransactionDetails?.maxPriorityFeePerGas)
              ) {
                return {
                  evmGasType,
                  gasEstimate,
                  maxFeePerGas: customGasTransactionDetails.maxFeePerGas,
                  maxPriorityFeePerGas:
                    customGasTransactionDetails.maxPriorityFeePerGas,
                };
              }
              break;
          }

          return {
            gasEstimate,
            ...gasDetailsBySpeed[GasHistoryPercentile.Medium],
          };
        }
      }
    },
    [
      gasDetailsBySpeed,
      gasEstimate,
      isMounted,
      network,
      sendWithPublicWallet,
      customGasTransactionDetails.gasPrice,
      customGasTransactionDetails.maxFeePerGas,
      customGasTransactionDetails.maxPriorityFeePerGas,
    ]
  );

  const {
    slowerGasDetails,
    standardGasDetails,
    fasterGasDetails,
    aggressiveGasDetails,
    customGasDetails,
  } = useMemo(() => {
    return {
      slowerGasDetails: validGasDetailsForNetworkFeeSelection(
        NetworkFeeSelection.Slower
      ),
      standardGasDetails: validGasDetailsForNetworkFeeSelection(
        NetworkFeeSelection.Standard
      ),
      fasterGasDetails: validGasDetailsForNetworkFeeSelection(
        NetworkFeeSelection.Faster
      ),
      aggressiveGasDetails: validGasDetailsForNetworkFeeSelection(
        NetworkFeeSelection.Aggressive
      ),
      customGasDetails: validGasDetailsForNetworkFeeSelection(
        NetworkFeeSelection.Custom
      ),
    };
  }, [validGasDetailsForNetworkFeeSelection]);

  const gasDetailsMap = useMemo((): Optional<GasDetailsMap> => {
    if (
      !slowerGasDetails ||
      !standardGasDetails ||
      !fasterGasDetails ||
      !aggressiveGasDetails ||
      !customGasDetails
    ) {
      return undefined;
    }
    return {
      [NetworkFeeSelection.Slower]: slowerGasDetails,
      [NetworkFeeSelection.Standard]: standardGasDetails,
      [NetworkFeeSelection.Faster]: fasterGasDetails,
      [NetworkFeeSelection.Aggressive]: aggressiveGasDetails,
      [NetworkFeeSelection.Custom]: customGasDetails,
    };
  }, [
    aggressiveGasDetails,
    customGasDetails,
    fasterGasDetails,
    slowerGasDetails,
    standardGasDetails,
  ]);

  const broadcasterTransactionGasDetailsWithZeroEstimate = useMemo(() => {
    if (!gasDetailsBySpeed) {
      return undefined;
    }
    const broadcasterGasHistoryPercentile =
      broadcasterGasHistoryPercentileForChain(network.current.name);
    return {
      gasEstimate: 0n,
      ...gasDetailsBySpeed[broadcasterGasHistoryPercentile],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasDetailsBySpeed, network.current.name]);

  const selectedGasDetails = useMemo(() => {
    return validGasDetailsForNetworkFeeSelection(networkFeeSelection);
  }, [networkFeeSelection, validGasDetailsForNetworkFeeSelection]);

  const { gasTokenBalanceError } = useGasTokenBalanceError(
    requiresProofGeneration,
    selectedGasDetails
  );

  const activeWallet = wallets.active;

  useEffect(() => {
    if (progressServiceGasEstimate.current) {
      progressServiceGasEstimate.current.stop();
      gasEstimateProgressCallback(10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFeeTokenAddress]);

  const refreshGasEstimate = useCallback(async () => {
    if (!activeWallet) {
      return;
    }
    if (!isMounted()) {
      return;
    }
    if (activeWallet.isViewOnlyWallet) {
      setGasEstimateError(
        new Error("This view-only wallet cannot be used for transactions.")
      );
      return;
    }
    if (latestSelectedBroadcasterLocked.current ?? false) {
      return;
    }
    logDev("refreshGasEstimate");
    setGasEstimateError(undefined);

    const currentGasEstimateID = generateKey();
    latestGasEstimateID.current = currentGasEstimateID;
    try {
      let gasEstimatePromise: Promise<bigint>;

      const networkName = network.current.name;

      if (isShieldedFromAddress) {
        if (!requiresProofGeneration) {
          if (currentGasEstimateID === latestGasEstimateID.current) {
            setGasEstimateError(
              new Error(
                "Shielded transactions always require proof generation."
              )
            );
          }
          return;
        }
        if (!isDefined(railWalletID)) {
          return;
        }
        if (!selectedBroadcaster && !sendWithPublicWallet) {
          return;
        }
        if (!isDefined(broadcasterTransactionGasDetailsWithZeroEstimate)) {
          return;
        }
        let feeTokenDetails: Optional<FeeTokenDetails>;
        if (selectedBroadcaster) {
          feeTokenDetails = {
            tokenAddress: selectedBroadcaster.tokenAddress,
            feePerUnitGas: BigInt(selectedBroadcaster.tokenFee.feePerUnitGas),
          };
        }

        gasEstimatePromise = promiseTimeout(
          (getGasEstimate as GetGasEstimateProofRequired)(
            txidVersion.current,
            networkName,
            railWalletID,
            memoText,
            erc20AmountRecipients,
            nftAmountRecipients,
            broadcasterTransactionGasDetailsWithZeroEstimate,
            feeTokenDetails,
            sendWithPublicWallet
          ),
          SharedConstants.GAS_ESTIMATE_TIMEOUT,
          new Error(
            "Timed out retrieving gas estimate for transaction. Please try again."
          )
        );
      } else {
        const fromWalletAddress = activeWallet.ethAddress;
        gasEstimatePromise = promiseTimeout(
          (getGasEstimate as GetGasEstimateSelfSigned)(
            txidVersion.current,
            networkName,
            fromWalletAddress,
            erc20AmountRecipients,
            nftAmountRecipients
          ),
          SharedConstants.GAS_ESTIMATE_TIMEOUT,
          new Error(
            "Timed out retrieving gas estimate for transaction. Please try again."
          )
        );
      }

      if (progressServiceGasEstimate.current) {
        progressServiceGasEstimate.current.stop();
      }

      progressServiceGasEstimate.current = new ProgressService(
        10,
        95,
        isShieldedFromAddress ? 14000 : 5000,
        250
      );
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      progressServiceGasEstimate.current.progressSteadily(
        gasEstimateProgressCallback
      );

      const gasEstimate = await gasEstimatePromise;

      if (
        !(latestSelectedBroadcasterLocked.current ?? false) &&
        currentGasEstimateID === latestGasEstimateID.current
      ) {
        progressServiceGasEstimate.current.stop();
        gasEstimateProgressCallback(95);
        setGasEstimate(gasEstimate);
      }
    } catch (err) {
      if (!(err instanceof Error)) {
        throw err;
      }
      logDevError(err);
      handleGasError(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeWallet?.id,
    isMounted,
    network.current.name,
    isShieldedFromAddress,
    requiresProofGeneration,
    railWalletID,
    selectedBroadcaster?.railgunAddress,
    selectedBroadcaster?.tokenAddress,
    selectedBroadcaster?.tokenFee.feePerUnitGas,
    sendWithPublicWallet,
    broadcasterTransactionGasDetailsWithZeroEstimate,
    memoText,
    erc20AmountRecipients,
    nftAmountRecipients,
    recipeOutput,
  ]);

  const refreshGasFeeData = useCallback(
    async (forceUseNewData = false) => {
      if (latestSelectedBroadcasterLocked.current ?? false) {
        return;
      }
      try {
        if (!remoteConfig.current) {
          throw new Error("No remote config for historical gas estimates.");
        }
        logDev("refreshGasFeeData");

        const { name: networkName } = network.current;

        const evmGasType = getEVMGasTypeForTransaction(
          networkName,
          sendWithPublicWallet
        );

        if (
          gasDetailsBySpeed &&
          networkFeeSelection === NetworkFeeSelection.Custom
        ) {
          logDev("Skip updating gas price - custom gas");
          return;
        }
        const gasDetails = await promiseTimeout(
          getGasDetailsBySpeed(evmGasType, networkName),
          SharedConstants.GAS_PRICE_TIMEOUT,
          new Error("Timed out retrieving current gas price from network.")
        );

        if (gasDetailsBySpeed && !forceUseNewData) {
          const speed =
            convertNetworkFeeSelectionToGasSpeed(networkFeeSelection) ??
            GasHistoryPercentile.Medium;
          const oldGas = gasDetailsBySpeed[speed];
          const newGas = gasDetails[speed];
          const oldCompareValue = extractGasValue(oldGas);
          const newCompareValue = extractGasValue(newGas);

          if (
            oldGas.evmGasType === newGas.evmGasType &&
            valuesWithinThresholdBigNumber(
              oldCompareValue,
              newCompareValue,
              SharedConstants.NETWORK_GAS_PRICE_CHANGE_THRESHOLD
            )
          ) {
            logDev("Skip updating gas price - not significantly changed");
            return;
          }
        }

        if (
          (latestSelectedBroadcasterLocked.current ?? false) &&
          !sendWithPublicWallet
        ) {
          logDev("Skip updating gas price - broadcaster locked");
          return;
        }

        setGasDetailsBySpeed(gasDetails);
      } catch (err) {
        if (!(err instanceof Error)) {
          throw err;
        }
        if (
          err.message !== "Timed out retrieving current gas price from network."
        ) {
          handleGasError(err);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      remoteConfig,
      network.current.name,
      sendWithPublicWallet,
      gasDetailsBySpeed,
      networkFeeSelection,
    ]
  );

  const handleGasError = (cause: Error) => {
    setGasEstimateError(cause);
  };

  useEffect(() => {
    latestSelectedBroadcasterLocked.current = selectedBroadcasterLocked;
  }, [selectedBroadcasterLocked]);

  useEffect(() => {
    logDev("clear gas estimate");
    setGasEstimate(undefined);
  }, [
    activeWallet?.id,
    railWalletID,
    sendWithPublicWallet,
    memoText,
    selectedBroadcaster?.tokenAddress,
  ]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshGasEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    erc20AmountRecipients,
    isShieldedFromAddress,
    memoText,
    network.current.name,
    nftAmountRecipients,
    railWalletID,
    broadcasterTransactionGasDetailsWithZeroEstimate,
    requiresProofGeneration,
    selectedBroadcaster?.railgunAddress,
    selectedBroadcaster?.tokenAddress,
    selectedBroadcaster?.tokenFee.feePerUnitGas,
    sendWithPublicWallet,
  ]);

  useEffect(() => {
    pollGasFeeData.current = refreshGasFeeData;
  }, [refreshGasFeeData]);

  useEffect(() => {
    latestSelectedBroadcasterLocked.current = selectedBroadcasterLocked;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshGasFeeData();
    const interval = setInterval(() => {
      latestSelectedBroadcasterLocked.current = selectedBroadcasterLocked;
      if (pollGasFeeData.current) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        pollGasFeeData.current();
      }
    }, SharedConstants.POLL_GAS_PRICE_DELAY_RPC);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    network.current.name,
    remoteConfig,
    selectedBroadcasterLocked,
    networkFeeSelection,
    sendWithPublicWallet,
  ]);

  const showExactCurrencyGasPrice = false;
  const { networkFeeText, networkFeePriceText } = isDefined(gasEstimateError)
    ? {
        networkFeeText: "Error",
        networkFeePriceText: "No gas estimate",
      }
    : selectedGasDetails
    ? networkGasText(
        network.current,
        networkPrices,
        selectedGasDetails,
        showExactCurrencyGasPrice
      )
    : {
        networkFeeText: SharedConstants.ESTIMATING_GAS_FEE_TEXT,
        networkFeePriceText: "Please wait",
      };

  const resetGasData = () => {
    setGasEstimate(undefined);
    setGasEstimateError(undefined);
    setGasDetailsBySpeed(undefined);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshGasFeeData(true);
  };

  return {
    networkFeeSelection,
    gasDetailsMap,
    networkFeeText,
    networkFeePriceText,
    selectedGasDetails,
    gasDetailsBySpeed,
    setNetworkFeeSelection,
    gasTokenBalanceError,
    gasEstimateError,
    refreshGasFeeData,
    refreshGasEstimate,
    resetGasData,
  };
};
