import {
  LiquidityV2Pool,
  RecipeOutput,
  SwapQuoteData,
} from "@railgun-community/cookbook";
import {
  isDefined,
  NetworkName,
  NFTAmount,
  NFTAmountRecipient,
  ProofType,
  RailgunERC20Recipient,
  RailgunWalletBalanceBucket,
  SelectedBroadcaster,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  NativeSyntheticEvent,
  RefreshControl,
  Text,
  TextInputEndEditingEventData,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Bar as ProgressBar } from "react-native-progress";
import { SafeAreaView } from "react-native-safe-area-context";
import { ContractTransaction, TransactionResponse } from "ethers";
import {
  AlertProps,
  GenericAlert,
} from "@components/alerts/GenericAlert/GenericAlert";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { AppHeader } from "@components/headers/AppHeader/AppHeader";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { HeaderTextButton } from "@components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { TextEntry } from "@components/inputs/TextEntry/TextEntry";
import { SelectableListItem } from "@components/list/SelectableListItem/SelectableListItem";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { SelectNetworkFeeStackParamList } from "@models/navigation-models";
import { NavigationProp } from "@react-navigation/native";
import {
  addSkippedBroadcaster,
  AvailableWallet,
  BlockedBroadcasterService,
  CalloutType,
  createAdjustedERC20AmountRecipientGroup,
  createRecipeFinalERC20Amounts,
  CustomGasTransactionDetails,
  ERC20Amount,
  ERC20AmountRecipient,
  findAllBroadcastersForToken,
  findRandomBroadcaster,
  FrontendWallet,
  GetGasEstimateProofRequired,
  GetGasEstimateSelfSigned,
  getMaxShieldPendingTimeText,
  getNetworkFrontendConfig,
  getOverallBatchMinGasPrice,
  getShieldingPOIDisclaimerMessage,
  getTransferPOIDisclaimerMessage,
  isShieldedFromToAddress,
  logDevError,
  NetworkFeeSelection,
  PerformGenerateProofType,
  PerformTransactionType,
  resetBroadcasterSkiplist,
  SelectTokenPurpose,
  setBroadcasterAddressFilters,
  SharedConstants,
  shortenWalletAddress,
  SignerType,
  StorageService,
  styleguide,
  TransactionType,
  useAdjustERC20AmountRecipientsForTransaction,
  useAppDispatch,
  useBestBroadcaster,
  useBroadcasterFee,
  useBroadcasterFeeERC20,
  useGasFeeWatcher,
  useHasPendingTransaction,
  useIsMounted,
  useNetworkFeeGasEstimator,
  useNextTransactionNonce,
  usePOIRequiredForCurrentNetwork,
  useProof,
  useRailgunFees,
  useReduxSelector,
  useRemoteConfigNetworkError,
  validateCachedProvedTransaction,
  Vault,
} from "@react-shared";
import { ErrorDetailsModal } from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { GenerateProofModal } from "@screens/modals/GenerateProofModal/GenerateProofModal";
import { ProcessTransactionModal } from "@screens/modals/ProcessTransactionModal/ProcessTransactionModal";
import { SelectERC20Modal } from "@screens/modals/SelectERC20Modal/SelectERC20Modal";
import { SelectWalletModal } from "@screens/modals/SelectWalletModal/SelectWalletModal";
import { callActionSheet } from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import {
  createPOIDisclaimerAlert,
  createPublicBroadcasterDisclaimerAlert,
  createSelfBroadcastDisclaimerAlert,
} from "@utils/alerts";
import { Constants } from "@utils/constants";
import { Icon } from "@views/components/icons/Icon";
import { SelectBroadcasterModal } from "@views/screens/modals/SelectBroadcasterModal/SelectBroadcasterModal";
import { ReviewTransactionReviewSection } from "./ReviewTransactionReviewSection/ReviewTransactionReviewSection";
import { styles } from "./styles";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: NavigationProp<any, any>;
  confirmButtonText: string;
  getGasEstimate: GetGasEstimateSelfSigned | GetGasEstimateProofRequired;
  performTransaction: PerformTransactionType;
  performGenerateProof?: PerformGenerateProofType;
  fromWalletAddress: string;
  onSuccessCallback: () => void;
  isFullyPrivateTransaction: boolean;
  erc20AmountRecipients: ERC20AmountRecipient[];
  nftAmountRecipients: NFTAmountRecipient[];
  infoCalloutText: string;
  processingText: string;
  hideTokenAmounts?: boolean;
  transactionType: TransactionType;
  cancelTxResponse?: TransactionResponse;
  swapQuote?: SwapQuoteData;
  swapBuyTokenAmount?: ERC20Amount;
  swapQuoteOutdated?: boolean;
  swapDestinationAddress?: string;
  setSwapDestinationAddress?: (destinationAddress: Optional<string>) => void;
  updateSwapQuote?: () => void;
  useRelayAdapt: boolean;
  showCustomNonce: boolean;
  isBaseTokenUnshield?: boolean;
  relayAdaptUnshieldERC20Amounts?: ERC20Amount[];
  relayAdaptUnshieldNFTAmounts?: NFTAmount[];
  relayAdaptShieldERC20Recipients?: RailgunERC20Recipient[];
  relayAdaptShieldNFTRecipients?: NFTAmountRecipient[];
  crossContractCalls?: ContractTransaction[];
  onBroadcasterFeeUpdate?: (
    broadcasterFeeERC20Amount: Optional<ERC20Amount>
  ) => void;
  onTransactionGasDetailsUpdate?: (
    gasDetails: Optional<TransactionGasDetails>
  ) => void;
  recipeOutput?: RecipeOutput;
  vault?: Vault;
  receivedMinimumAmounts?: ERC20Amount[];
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  requireSelfSigned?: boolean;

  pool?: LiquidityV2Pool;
  setSlippagePercent?: (slippage: number) => void;
  slippagePercent?: number;
};

export const ReviewTransactionView: React.FC<Props> = ({
  navigation,
  confirmButtonText,
  getGasEstimate,
  performTransaction,
  performGenerateProof,
  fromWalletAddress,
  onSuccessCallback,
  isFullyPrivateTransaction,
  erc20AmountRecipients,
  nftAmountRecipients,
  infoCalloutText,
  processingText,
  hideTokenAmounts,
  transactionType,
  cancelTxResponse,
  swapQuote,
  swapBuyTokenAmount,
  receivedMinimumAmounts,
  swapQuoteOutdated = false,
  swapDestinationAddress,
  setSwapDestinationAddress,
  updateSwapQuote,
  useRelayAdapt,
  showCustomNonce,
  isBaseTokenUnshield = false,
  relayAdaptUnshieldERC20Amounts,
  relayAdaptUnshieldNFTAmounts,
  relayAdaptShieldERC20Recipients,
  relayAdaptShieldNFTRecipients,
  crossContractCalls,
  requireSelfSigned,
  onBroadcasterFeeUpdate,
  onTransactionGasDetailsUpdate,
  setSlippagePercent,
  slippagePercent,
  recipeOutput,
  vault,
  pool,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { txidVersion } = useReduxSelector("txidVersion");
  const { remoteConfig } = useReduxSelector("remoteConfig");

  const dispatch = useAppDispatch();

  const { showActionSheetWithOptions } = useActionSheet();

  const [gasEstimateProgress, setGasEstimateProgress] = useState(0);
  const [alert, setAlert] = useState<AlertProps | undefined>();
  const [transactionSuccessTxid, setTransactionSuccessTxid] =
    useState<Optional<string>>();
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showProofTimerExpiredOnFail, setShowProofTimerExpiredOnFail] =
    useState(false);

  const [error, setError] = useState<Optional<Error>>();

  const [hasBroadcasterError, setHasBroadcasterError] = useState(false);

  const [showBroadcasterSelectorModal, setShowBroadcasterSelectorModal] =
    useState(false);
  const [signerType, setSignerType] = useState<Optional<SignerType>>();
  const [customNonce, setCustomNonce] = useState<Optional<number>>();
  const [publicWalletOverride, setPublicWalletOverride] =
    useState<Optional<AvailableWallet>>();
  const [forceBroadcaster, setForceBroadcaster] =
    useState<Optional<SelectedBroadcaster>>();
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const [shieldedTransferMemo, setShieldedTransferMemo] =
    useState<Optional<string>>();

  const [showSenderAddressToRecipient, setShowSenderAddressToRecipient] =
    useState(true);

  const [showWalletSelectorModal, setShowWalletSelectorModal] = useState(false);

  const [customGasTransactionDetails, setCustomGasTransactionDetails] =
    useState<Optional<CustomGasTransactionDetails>>();

  const [refreshing, setRefreshing] = useState(false);
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);

  const hasSeenPOIShieldDisclaimer = useRef(false);

  const { isShieldedFromAddress, isShieldedToAddress } =
    isShieldedFromToAddress(transactionType, isFullyPrivateTransaction);

  const isRailgunShieldedTransfer =
    isShieldedFromAddress && transactionType === TransactionType.Send;
  const requiresProofGeneration = isShieldedFromAddress;

  const { nextTransactionNonce } = useNextTransactionNonce(
    fromWalletAddress,
    isShieldedFromAddress,
    publicWalletOverride
  );

  const { isMounted } = useIsMounted();

  const firstUpdate = useRef(true);
  const goBack = useCallback(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }
    dispatch(resetBroadcasterSkiplist());
    navigation.goBack();
  }, [dispatch, navigation]);

  useEffect(() => {
    goBack();
  }, [goBack, network, wallets.active]);

  const { calculateFeesError } = useRailgunFees(
    transactionType,
    isRailgunShieldedTransfer
  );

  const { hasPendingTransaction } = useHasPendingTransaction(
    publicWalletOverride,
    fromWalletAddress,
    isShieldedFromAddress,
    transactionSuccessTxid
  );

  const { poiRequired } = usePOIRequiredForCurrentNetwork();

  useEffect(() => {
    const check = async () => {
      const hasSeen = await StorageService.getItem(
        SharedConstants.HAS_SEEN_POI_SHIELD_DISCLAIMER
      );

      hasSeenPOIShieldDisclaimer.current = isDefined(hasSeen);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    check();
  }, []);

  useEffect(() => {
    if (showProofTimerExpiredOnFail) {
      if (!showProcessModal) {
        Alert.alert("Proof expired", "Please prove your transaction again.");
        invalidateProof();
      }

      setShowProofTimerExpiredOnFail(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProcessModal, showProofTimerExpiredOnFail]);

  const proofTimerExpired = () => {
    setShowProofTimerExpiredOnFail(true);
  };

  const {
    selectedFeeToken,
    selectBroadcasterFeeERC20Modal,
    showBroadcasterFeeERC20Modal,
    onDismissSelectBroadcasterFee,
  } = useBroadcasterFeeERC20(erc20AmountRecipients, useRelayAdapt);

  const {
    selectedBroadcaster,
    allBroadcasters,
    requiresBroadcaster,
    lockBroadcaster,
    selectedBroadcasterLocked,
  } = useBestBroadcaster(
    transactionType,
    isFullyPrivateTransaction,
    selectedFeeToken,
    useRelayAdapt,
    isMounted,
    findRandomBroadcaster,
    findAllBroadcastersForToken,
    setBroadcasterAddressFilters,
    forceBroadcaster
  );

  const isBroadcasterTransaction =
    requiresBroadcaster && requireSelfSigned !== true && !publicWalletOverride;
  const sendWithPublicWallet = !isBroadcasterTransaction;

  const updateGasEstimateProgress = (amount: number) => {
    setGasEstimateProgress(amount / 100);
  };

  const changeFeeToken = () => {
    setShowBroadcasterSelectorModal(false);
    selectBroadcasterFeeERC20Modal();
  };

  const {
    networkFeeSelection,
    gasDetailsMap,
    networkFeeText,
    networkFeePriceText,
    setNetworkFeeSelection,
    selectedGasDetails,
    gasDetailsBySpeed,
    gasTokenBalanceError,
    gasEstimateError,
    refreshGasFeeData,
    resetGasData,
  } = useNetworkFeeGasEstimator(
    getGasEstimate,
    requiresProofGeneration,
    isShieldedFromAddress,
    shieldedTransferMemo,
    erc20AmountRecipients,
    nftAmountRecipients,
    customGasTransactionDetails ?? {},
    selectedBroadcasterLocked,
    selectedBroadcaster,
    sendWithPublicWallet,
    isMounted,
    updateGasEstimateProgress,
    selectedFeeToken.address,
    recipeOutput
  );

  useEffect(() => {
    if (onTransactionGasDetailsUpdate) {
      onTransactionGasDetailsUpdate(selectedGasDetails);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGasDetails]);

  useEffect(() => {
    if (isDefined(transactionSuccessTxid) && !showProcessModal) {
      onSuccessCallback();
    }
  }, [onSuccessCallback, showProcessModal, transactionSuccessTxid]);

  const overallBatchMinGasPrice: Optional<bigint> = selectedGasDetails
    ? getOverallBatchMinGasPrice(isBroadcasterTransaction, selectedGasDetails)
    : undefined;

  const {
    broadcasterFeeText,
    broadcasterFeeSubtext,
    broadcasterFeeERC20Amount,
    broadcasterFeeIsEstimating,
  } = useBroadcasterFee(
    selectedFeeToken,
    selectedBroadcaster,
    selectedBroadcasterLocked,
    selectedGasDetails,
    gasDetailsBySpeed,
    gasEstimateError
  );

  useEffect(() => {
    if (onBroadcasterFeeUpdate) {
      onBroadcasterFeeUpdate(broadcasterFeeERC20Amount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcasterFeeERC20Amount]);

  const changeThresholdBasisPoints = 500;
  const { gasPriceChangedByThreshold } = useGasFeeWatcher(
    selectedGasDetails,
    selectedBroadcasterLocked,
    changeThresholdBasisPoints
  );

  const useRailgunBalances =
    isFullyPrivateTransaction || transactionType === TransactionType.Unshield;
  const { adjustedERC20AmountRecipients } =
    useAdjustERC20AmountRecipientsForTransaction(
      erc20AmountRecipients,
      transactionType,
      useRailgunBalances,
      selectedGasDetails,
      broadcasterFeeERC20Amount,
      sendWithPublicWallet
    );

  const finalAdjustedERC20AmountRecipientGroup = useMemo(() => {
    return createAdjustedERC20AmountRecipientGroup(
      adjustedERC20AmountRecipients
    );
  }, [adjustedERC20AmountRecipients]);

  const validateProvedTransaction = useCallback(
    (
      networkName: NetworkName,
      proofType: ProofType,
      railWalletID: string,
      showSenderAddressToRecipient: boolean,
      memoText: Optional<string>,
      erc20AmountRecipients: ERC20AmountRecipient[],
      nftAmountRecipients: NFTAmountRecipient[],
      broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
      sendWithPublicWallet: boolean,
      overallBatchMinGasPrice: Optional<bigint>
    ) => {
      return validateCachedProvedTransaction(
        txidVersion.current,
        networkName,
        proofType,
        railWalletID,
        showSenderAddressToRecipient,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        relayAdaptUnshieldERC20Amounts
          ? finalAdjustedERC20AmountRecipientGroup.inputs
          : undefined,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Recipients,
        relayAdaptShieldNFTRecipients,
        crossContractCalls,
        broadcasterFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice
      );
    },
    [
      txidVersion,
      crossContractCalls,
      finalAdjustedERC20AmountRecipientGroup.inputs,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
    ]
  );

  const {
    hasValidProof,
    invalidateProof,
    clearProofTimer,
    proofExpirationSeconds,
    showGenerateProofModal,
    onGenerateProofSuccess,
    onGenerateProofFail,
    tryGenerateProof,
  } = useProof(
    transactionType,
    requiresProofGeneration,
    showSenderAddressToRecipient,
    shieldedTransferMemo,
    finalAdjustedERC20AmountRecipientGroup.inputs,
    nftAmountRecipients,
    isBaseTokenUnshield,
    selectedBroadcaster,
    broadcasterFeeERC20Amount,
    sendWithPublicWallet,
    overallBatchMinGasPrice,
    setError,
    lockBroadcaster,
    proofTimerExpired,
    validateProvedTransaction
  );

  const { remoteConfigNetworkError } = useRemoteConfigNetworkError(
    transactionType,
    isRailgunShieldedTransfer,
    useRelayAdapt
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setError(undefined);
    await refreshGasFeeData();
    setRefreshing(false);
  };

  const openPublicWalletOverrideSelector = () => {
    setShowWalletSelectorModal(true);
  };

  const openBroadcasterSelector = () => {
    setShowBroadcasterSelectorModal(true);
  };

  const onDismissBroadcasterSelector = (
    broadcaster: Optional<SelectedBroadcaster>,
    randomBroadcaster: boolean
  ) => {
    if (broadcaster || randomBroadcaster) {
      setForceBroadcaster(broadcaster);
      setSignerType(SignerType.PublicBroadcaster);
      resetGasData();
    }

    setShowBroadcasterSelectorModal(false);
  };

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  const triggerUpdateSwapQuote = useCallback(() => {
    if (updateSwapQuote) {
      invalidateProof();
      updateSwapQuote();
    }
  }, [invalidateProof, updateSwapQuote]);

  const openNetworkFeeSelector = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    const params: SelectNetworkFeeStackParamList["SelectNetworkFeeModal"] = {
      onDismiss: onDismissNetworkFeeModal,
      currentOption: networkFeeSelection,
      gasDetailsMap,
      defaultCustomGasTransactionDetails: customGasTransactionDetails ?? {},
      selectedBroadcaster,
      selectedFeeToken,
      isBroadcasterTransaction,
    };

    navigation.navigate("SelectNetworkFee", {
      screen: "SelectNetworkFeeModal",
      params,
    });
  };

  const onDismissNetworkFeeModal = (
    newNetworkFeeSelection?: NetworkFeeSelection,
    customGasTransactionDetails?: CustomGasTransactionDetails
  ) => {
    if (newNetworkFeeSelection) {
      if (newNetworkFeeSelection === NetworkFeeSelection.Custom) {
        if (!customGasTransactionDetails) {
          logDevError("No custom gas fees provided.");
          return;
        }
        setCustomGasTransactionDetails(customGasTransactionDetails);
      }
      setNetworkFeeSelection(newNetworkFeeSelection);
    }
  };

  const onDismissPublicWalletOverrideSelector = (
    wallet?: FrontendWallet,
    _address?: string,
    removeSelectedWallet: boolean = false
  ) => {
    if (removeSelectedWallet) {
      setPublicWalletOverride(undefined);
    } else if (wallet && !wallet.isViewOnlyWallet) {
      setPublicWalletOverride(wallet);
    }
    setShowWalletSelectorModal(false);
  };

  const activeWallet = wallets.active;

  const recipeFinalERC20Amounts = useMemo(
    () =>
      createRecipeFinalERC20Amounts(
        activeWallet,
        network.current.name,
        erc20AmountRecipients,
        recipeOutput
      ),
    [activeWallet, network, recipeOutput, erc20AmountRecipients]
  );

  if (!activeWallet || activeWallet.isViewOnlyWallet) {
    return null;
  }

  const onTransactionSuccess = () => {
    clearProofTimer();
    setShowProcessModal(false);
    onSuccessCallback();
  };

  const onTransactionFail = (
    err: Error,
    isBroadcasterError: boolean = false
  ) => {
    setShowProcessModal(false);
    setError(err);
    setHasBroadcasterError(isBroadcasterError);
  };

  const onTapSend = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    if (
      poiRequired &&
      !hasSeenPOIShieldDisclaimer.current &&
      transactionType === TransactionType.Shield
    ) {
      showLearnMorePOIShield(onTapSend);
      return;
    }

    setHasBroadcasterError(false);
    setShowProcessModal(true);
  };

  const onTapRetryBroadcasterTransaction = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    if (sendWithPublicWallet) {
      onTapSend();
      return;
    }

    const railgunAddress = selectedBroadcaster?.railgunAddress;
    callActionSheet(
      showActionSheetWithOptions,
      `Broadcaster: ${shortenWalletAddress(railgunAddress ?? "Unknown")}`,
      [
        {
          name: "Refresh gas and try again",
          action: resetProofAndGas,
        },
        {
          name: "Retry with a different public broadcaster",
          action: () => skipBroadcaster(railgunAddress),
        },
        {
          name: "Block this public broadcaster",
          action: () => blockBroadcaster(railgunAddress),
          isDestructive: true,
        },
      ]
    );
  };

  const onTapBroadcasterOptions = () => {
    triggerHaptic(HapticSurface.NavigationButton);

    const disableBroadcasterGasPrice = !selectedBroadcaster || !gasDetailsMap;

    callActionSheet(showActionSheetWithOptions, `Broadcaster options`, [
      {
        name: "Select gas fee token",
        action: selectBroadcasterFeeERC20Modal,
      },
      {
        name: "Set gas price for transaction",
        action: openNetworkFeeSelector,
        disabled: disableBroadcasterGasPrice,
      },
    ]);
  };

  const resetProof = () => {
    invalidateProof();
    setError(undefined);
    setHasBroadcasterError(false);
  };

  const resetProofAndGas = () => {
    resetProof();
    resetGasData();
  };

  const skipBroadcaster = (pubKey?: string) => {
    if (isDefined(pubKey)) {
      dispatch(addSkippedBroadcaster(pubKey));
    }
    resetProofAndGas();
  };

  const blockBroadcaster = async (pubKey?: string) => {
    if (isDefined(pubKey)) {
      const blockedBroadcasterService = new BlockedBroadcasterService(dispatch);
      await blockedBroadcasterService.addBlockedBroadcaster(pubKey, undefined);
    }
    resetProofAndGas();
  };

  const promptUnlockBroadcaster = () => {
    Alert.alert(
      "Unlock Broadcaster",
      "Reset proof and unlock public broadcaster selection.",
      [
        {
          text: "Reset proof",
          onPress: resetProofAndGas,
          style: "destructive",
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const infoCallout = () => {
    if (isFullyPrivateTransaction) {
      return <InfoCallout type={CalloutType.Secure} text={infoCalloutText} />;
    }
    const frontendConfig = getNetworkFrontendConfig(network.current.name);
    return (
      <InfoCallout
        type={CalloutType.Insecure}
        text={infoCalloutText}
        borderColor={frontendConfig.backgroundColor}
        gradientColors={frontendConfig.gradientColors}
        style={styles.infoCallout}
      />
    );
  };

  const poiInfoCallout = () => {
    if (!poiRequired) {
      return null;
    }

    const frontendConfig = getNetworkFrontendConfig(network.current.name);

    switch (transactionType) {
      case TransactionType.Shield: {
        const text = `Shielded tokens have a temporary unshield-only standby period of ${getMaxShieldPendingTimeText(
          network.current
        )}.`;

        return (
          <InfoCallout
            text={text}
            ctaButton="Read more"
            type={CalloutType.Secure}
            onCtaPress={() => showLearnMorePOIShield()}
            style={styles.warningInfoCallout}
            borderColor={frontendConfig.backgroundColor}
            gradientColors={styleguide.colors.gradients.railgunDark.colors}
          />
        );
      }
      case TransactionType.Send: {
        if (!isFullyPrivateTransaction) {
          return null;
        }

        const text = `Keep Railway open and active after sending a 0zk-0zk transfer (up to 30 seconds) until a Private Proof of Innocence is created.`;

        return (
          <InfoCallout
            text={text}
            ctaButton="Read more"
            type={CalloutType.Secure}
            style={styles.warningInfoCallout}
            onCtaPress={showLearnMorePOITransfer}
            borderColor={frontendConfig.backgroundColor}
            gradientColors={styleguide.colors.gradients.railgunDark.colors}
          />
        );
      }
      case TransactionType.ApproveShield:
      case TransactionType.Unshield:
      case TransactionType.Swap:
      case TransactionType.ApproveSpender:
      case TransactionType.Mint:
      case TransactionType.Cancel:
      case TransactionType.FarmDeposit:
      case TransactionType.FarmRedeem:
      case TransactionType.AddLiquidity:
      case TransactionType.RemoveLiquidity:
        return null;
    }
  };

  const showLearnMorePOIShield = (callback?: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    StorageService.setItem(SharedConstants.HAS_SEEN_POI_SHIELD_DISCLAIMER, "1");
    hasSeenPOIShieldDisclaimer.current = true;

    createPOIDisclaimerAlert(
      "Shielding",
      getShieldingPOIDisclaimerMessage(network.current),
      setAlert,
      dispatch,
      remoteConfig?.current?.poiDocumentation,
      callback,
      isDefined(callback) ? "Continue" : undefined
    );
  };

  const showLearnMorePOITransfer = () => {
    createPOIDisclaimerAlert(
      "Private Transfer",
      getTransferPOIDisclaimerMessage(),
      setAlert,
      dispatch,
      remoteConfig?.current?.poiDocumentation
    );
  };

  const warningInfoCallout = () => {
    if (
      hasPendingTransaction &&
      transactionType !== TransactionType.Cancel &&
      !showProcessModal
    ) {
      return (
        <InfoCallout
          type={CalloutType.Warning}
          text="Warning: The selected wallet currently has a pending transaction. The new transaction will be queued, and it will execute when all pending transactions are completed or cancelled."
          style={styles.warningInfoCallout}
          borderColor={styleguide.colors.danger}
          gradientColors={styleguide.colors.gradients.redCallout.colors}
        />
      );
    }
    return null;
  };

  const showSelfBroadcastDisclaimer = () => {
    createSelfBroadcastDisclaimerAlert(setAlert, dispatch);
  };

  const showPublicBroadcasterDisclaimer = () => {
    createPublicBroadcasterDisclaimerAlert(setAlert, dispatch);
  };

  const enablePublicWalletOverride =
    requiresBroadcaster && requireSelfSigned !== true;
  const showHideSenderAddress = isRailgunShieldedTransfer;
  const enableAdvancedFields =
    showCustomNonce || enablePublicWalletOverride || showHideSenderAddress;

  const hideSendButton = requiresProofGeneration && !hasValidProof;

  const disableSendRequiresNewSwapQuote =
    swapQuoteOutdated && isDefined(updateSwapQuote);

  const disableSendButton =
    isDefined(calculateFeesError) ||
    isDefined(remoteConfigNetworkError) ||
    hasBroadcasterError ||
    !isDefined(selectedGasDetails) ||
    disableSendRequiresNewSwapQuote;

  const disableProofGeneration =
    !isDefined(selectedGasDetails) ||
    (!isDefined(publicWalletOverride) &&
      !isDefined(selectedBroadcaster) &&
      requireSelfSigned !== true) ||
    disableSendRequiresNewSwapQuote;

  const currentError =
    calculateFeesError ??
    remoteConfigNetworkError ??
    gasTokenBalanceError ??
    error ??
    gasEstimateError;

  const renderSelectSignerType = () => {
    return (
      <View>
        <View style={styles.selectSignerTypeButton}>
          <SelectableListItem
            title="Self Broadcast"
            onTap={openPublicWalletOverrideSelector}
            showTopBorder
            showBottomBorder
            customRightView={
              <Icon
                source="chevron-right"
                size={24}
                color={styleguide.colors.labelSecondary}
              />
            }
          />
          <Text
            style={styles.disclaimerText}
            onPress={showSelfBroadcastDisclaimer}
          >
            What is this?
          </Text>
        </View>
        <View style={styles.selectSignerTypeButton}>
          <SelectableListItem
            title="Public Broadcaster"
            onTap={openBroadcasterSelector}
            showTopBorder
            showBottomBorder
            customRightView={
              <Icon
                source="chevron-right"
                size={24}
                color={styleguide.colors.labelSecondary}
              />
            }
          />
          <Text
            style={styles.disclaimerText}
            onPress={showPublicBroadcasterDisclaimer}
          >
            What is this?
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <SelectWalletModal
        show={showWalletSelectorModal}
        closeModal={() => {
          setShowWalletSelectorModal(false);
        }}
        title="Select signing wallet"
        isRailgunInitial={false}
        selectedWallet={publicWalletOverride}
        onDismiss={onDismissPublicWalletOverrideSelector}
        showBroadcasterOption={false}
        availableWalletsOnly
      />
      <SelectBroadcasterModal
        show={showBroadcasterSelectorModal}
        onDismiss={() => onDismissBroadcasterSelector(undefined, false)}
        onRandomBroadcaster={() =>
          onDismissBroadcasterSelector(undefined, true)
        }
        onSelectBroadcaster={(broadcaster: Optional<SelectedBroadcaster>) =>
          onDismissBroadcasterSelector(broadcaster, false)
        }
        changeFeeToken={changeFeeToken}
        selectedBroadcaster={forceBroadcaster}
        allBroadcasters={allBroadcasters}
        feeToken={selectedFeeToken}
      />
      <SelectERC20Modal
        isRailgun
        skipBaseToken
        transactionType={null}
        show={showBroadcasterFeeERC20Modal}
        headerTitle="Select fee token"
        onDismiss={onDismissSelectBroadcasterFee}
        balanceBucketFilter={balanceBucketFilter}
        purpose={SelectTokenPurpose.BroadcasterFee}
        useRelayAdaptForBroadcasterFee={useRelayAdapt}
      />
      <GenerateProofModal
        finalERC20AmountRecipients={
          finalAdjustedERC20AmountRecipientGroup.inputs
        }
        nftAmountRecipients={nftAmountRecipients}
        selectedBroadcaster={selectedBroadcaster}
        broadcasterFeeERC20Amount={broadcasterFeeERC20Amount}
        show={showGenerateProofModal}
        publicWalletOverride={publicWalletOverride}
        memoText={shieldedTransferMemo}
        showSenderAddressToRecipient={showSenderAddressToRecipient}
        overallBatchMinGasPrice={overallBatchMinGasPrice}
        performGenerateProof={async (
          finalERC20AmountRecipients,
          nftAmountRecipients,
          selectedBroadcaster,
          broadcasterFeeERC20Amount,
          publicWalletOverride,
          showSenderAddressToRecipient,
          memoText,
          overallBatchMinGasPrice,
          success,
          fail
        ) => {
          setError(undefined);
          if (!performGenerateProof) {
            fail(new Error("No proof generation available."));
            return;
          }
          await performGenerateProof(
            finalERC20AmountRecipients,
            nftAmountRecipients,
            selectedBroadcaster,
            broadcasterFeeERC20Amount,
            publicWalletOverride,
            showSenderAddressToRecipient,
            memoText,
            overallBatchMinGasPrice,
            success,
            fail
          );
        }}
        onSuccessClose={onGenerateProofSuccess}
        onFailClose={onGenerateProofFail}
      />
      <ProcessTransactionModal
        show={showProcessModal}
        finalAdjustedERC20AmountRecipientGroup={
          finalAdjustedERC20AmountRecipientGroup
        }
        nftAmountRecipients={nftAmountRecipients}
        performTransaction={async (
          finalAdjustedERC20AmountRecipientGroup,
          nftAmountRecipients,
          selectedBroadcaster,
          broadcasterFeeERC20Amount,
          transactionGasDetails,
          customNonce,
          publicWalletOverride,
          showSenderAddressToRecipient,
          memoText,
          success,
          error
        ) => {
          if (isDefined(transactionSuccessTxid)) {
            const alreadySubmittedError = new Error(
              "Transaction already submitted."
            );
            setError(alreadySubmittedError);
            error(alreadySubmittedError);
            return;
          }
          setError(undefined);
          const txid = await performTransaction(
            finalAdjustedERC20AmountRecipientGroup,
            nftAmountRecipients,
            selectedBroadcaster,
            broadcasterFeeERC20Amount,
            transactionGasDetails,
            customNonce,
            publicWalletOverride,
            showSenderAddressToRecipient,
            memoText,
            success,
            error
          );
          setTransactionSuccessTxid(txid);
          return txid;
        }}
        selectedBroadcaster={selectedBroadcaster}
        broadcasterFeeERC20Amount={broadcasterFeeERC20Amount}
        transactionGasDetails={selectedGasDetails}
        onSuccessClose={onTransactionSuccess}
        onFailClose={onTransactionFail}
        processingText={processingText}
        customNonce={customNonce}
        publicWalletOverride={publicWalletOverride}
        showSenderAddressToRecipient={showSenderAddressToRecipient}
        memoText={shieldedTransferMemo}
        successText="Transaction sent"
        showKeepAppOpenText
      />
      <AppHeader
        title="Review transaction"
        allowFontScaling
        isModal={false}
        headerLeft={
          <HeaderBackButton
            label="Edit"
            customAction={() => {
              if (hasValidProof) {
                Alert.alert(
                  "Warning",
                  "You will lose your current proof if you navigate back.",
                  [
                    {
                      text: "Go back",
                      onPress: goBack,
                      style: "destructive",
                    },
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                  ]
                );
                return;
              }
              goBack();
            }}
          />
        }
        headerRight={
          !hideSendButton ? (
            <HeaderTextButton
              text={confirmButtonText}
              onPress={onTapSend}
              disabled={disableSendButton}
            />
          ) : null
        }
      />
      <SafeAreaView edges={["bottom"]}>
        <KeyboardAwareScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={styleguide.colors.white}
            />
          }
          enableOnAndroid
          extraHeight={110}
        >
          <View style={styles.wrapper}>
            {infoCallout()}
            {poiInfoCallout()}
            {warningInfoCallout()}
            <ReviewTransactionReviewSection
              transactionType={transactionType}
              receivedMinimumAmounts={receivedMinimumAmounts}
              fromWalletAddress={fromWalletAddress}
              adjustedERC20AmountRecipients={adjustedERC20AmountRecipients}
              hideTokenAmounts={hideTokenAmounts}
              isShieldedFromAddress={isShieldedFromAddress}
              isShieldedToAddress={isShieldedToAddress}
              isFullyPrivateTransaction={isFullyPrivateTransaction}
              cancelTxResponse={cancelTxResponse}
              swapQuote={swapQuote}
              swapBuyTokenAmount={swapBuyTokenAmount}
              swapQuoteOutdated={swapQuoteOutdated}
              slippagePercent={slippagePercent}
              setSlippagePercent={setSlippagePercent}
              swapDestinationAddress={swapDestinationAddress}
              setSwapDestinationAddress={setSwapDestinationAddress}
              updateSwapQuote={triggerUpdateSwapQuote}
              isBaseTokenUnshield={isBaseTokenUnshield}
              recipeFinalERC20Amounts={recipeFinalERC20Amounts}
              vault={vault}
              pool={pool}
            />
            {}
            {}
            {!isDefined(signerType) &&
              isBroadcasterTransaction &&
              renderSelectSignerType()}
            {(isDefined(signerType) || !isBroadcasterTransaction) && (
              <>
                <View style={styles.networkFeeWrapper}>
                  {requiresBroadcaster && !publicWalletOverride ? (
                    <>
                      <SelectableListItem
                        title="Gas fee"
                        titleIconSource={
                          selectedBroadcasterLocked ? "lock-outline" : undefined
                        }
                        description={
                          selectedGasDetails && selectedBroadcaster
                            ? `via broadcaster ${shortenWalletAddress(
                                selectedBroadcaster.railgunAddress
                              )}`
                            : broadcasterFeeIsEstimating
                            ? broadcasterFeeText
                            : ""
                        }
                        rightText={broadcasterFeeText}
                        rightSubtext={broadcasterFeeSubtext}
                        onTap={
                          selectedBroadcasterLocked
                            ? promptUnlockBroadcaster
                            : onTapBroadcasterOptions
                        }
                        showTopBorder
                        showBottomBorder
                        customRightView={
                          broadcasterFeeIsEstimating ? (
                            <View style={styles.gasEstimateProgressBarWrapper}>
                              <Text style={styles.gasEstimateProgressLabel}>
                                Estimating...
                              </Text>
                              <ProgressBar
                                progress={gasEstimateProgress}
                                color={styleguide.colors.txGreen()}
                                borderColor={styleguide.colors.white}
                                style={styles.gasEstimateProgressBar}
                              />
                            </View>
                          ) : undefined
                        }
                      />
                      {selectedBroadcasterLocked &&
                        hasValidProof &&
                        gasPriceChangedByThreshold &&
                        !showGenerateProofModal &&
                        !showProcessModal && (
                          <Text
                            style={styles.broadcasterFeeWarning}
                            onPress={resetProofAndGas}
                          >
                            Gas prices have changed, and your gas fee may not be
                            valid. Tap to update.
                          </Text>
                        )}
                    </>
                  ) : (
                    <SelectableListItem
                      title="Gas fee"
                      description={
                        networkFeeText ===
                        SharedConstants.ESTIMATING_GAS_FEE_TEXT
                          ? `Paid in ${network.current.baseToken.symbol}`
                          : "Estimated"
                      }
                      rightText={networkFeeText}
                      rightSubtext={networkFeePriceText}
                      onTap={openNetworkFeeSelector}
                      disabled={!selectedGasDetails}
                      showTopBorder
                      showBottomBorder
                      customRightView={
                        networkFeeText ===
                        SharedConstants.ESTIMATING_GAS_FEE_TEXT ? (
                          <View style={styles.gasEstimateProgressBarWrapper}>
                            <Text style={styles.gasEstimateProgressLabel}>
                              Estimating...
                            </Text>
                            <ProgressBar
                              progress={gasEstimateProgress}
                              color={styleguide.colors.txGreen()}
                              borderColor={styleguide.colors.white}
                              style={styles.gasEstimateProgressBar}
                            />
                          </View>
                        ) : undefined
                      }
                    />
                  )}
                </View>
                {Constants.ENABLE_MEMO_FIELD && isRailgunShieldedTransfer && (
                  <View style={styles.textFieldWrapper}>
                    <TextEntry
                      label="Private memo"
                      placeholder="Text and emojis"
                      viewStyles={[styles.textEntryField]}
                      autoCapitalize="none"
                      multiline
                      onChangeText={invalidateProof}
                      onEndEditing={(
                        event: NativeSyntheticEvent<TextInputEndEditingEventData>
                      ) => {
                        setShieldedTransferMemo(
                          event.nativeEvent.text.length
                            ? event.nativeEvent.text.trim()
                            : undefined
                        );
                      }}
                    />
                  </View>
                )}
                {enableAdvancedFields && (
                  <>
                    {!showAdvancedOptions && (
                      <View style={styles.advancedOptionsButtonWrapper}>
                        <Text
                          onPress={() => {
                            triggerHaptic(HapticSurface.SelectItem);
                            setShowAdvancedOptions(!showAdvancedOptions);
                          }}
                          style={styles.advancedOptionsButton}
                        >
                          {showAdvancedOptions
                            ? "Hide advanced options"
                            : "Show advanced options"}
                        </Text>
                      </View>
                    )}
                    {showAdvancedOptions && enablePublicWalletOverride && (
                      <View style={styles.textFieldWrapper}>
                        <SelectableListItem
                          title="Signer"
                          titleIconSource={
                            selectedBroadcasterLocked
                              ? "lock-outline"
                              : undefined
                          }
                          rightText={
                            publicWalletOverride
                              ? publicWalletOverride.name
                              : "Public Broadcaster"
                          }
                          rightSubtext={
                            publicWalletOverride
                              ? "Encrypted"
                              : "Encrypted & anonymous"
                          }
                          onTap={() => {
                            triggerHaptic(HapticSurface.NavigationButton);
                            resetProof();
                            setPublicWalletOverride(undefined);
                            setForceBroadcaster(undefined);
                            setSignerType(undefined);
                          }}
                          showTopBorder
                          showBottomBorder
                          disabled={selectedBroadcasterLocked || hasValidProof}
                        />
                      </View>
                    )}
                    {showAdvancedOptions &&
                      (showCustomNonce || publicWalletOverride) && (
                        <View style={styles.textFieldWrapper}>
                          <TextEntry
                            label="Nonce"
                            placeholder={String(
                              nextTransactionNonce ?? "Enter nonce"
                            )}
                            viewStyles={[styles.textEntryField]}
                            onChangeText={(text) =>
                              setCustomNonce(
                                text.length ? parseInt(text, 10) : undefined
                              )
                            }
                            keyboardType="number-pad"
                            maxLength={8}
                          />
                        </View>
                      )}
                    {showAdvancedOptions && showHideSenderAddress && (
                      <View style={styles.textFieldWrapper}>
                        <SelectableListItem
                          title="Sender address"
                          rightText={
                            showSenderAddressToRecipient ? "Visible" : "Hidden"
                          }
                          rightSubtext={
                            showSenderAddressToRecipient
                              ? "Shown only to receiver"
                              : "Not seen by anyone"
                          }
                          onTap={() => {
                            triggerHaptic(HapticSurface.SelectItem);
                            resetProof();
                            setShowSenderAddressToRecipient(
                              !showSenderAddressToRecipient
                            );
                          }}
                          showTopBorder
                          showBottomBorder
                          hideRightIcon
                        />
                      </View>
                    )}
                  </>
                )}
                {isDefined(currentError) &&
                  !showGenerateProofModal &&
                  !showProcessModal && (
                    <>
                      <Text style={styles.errorText}>
                        {currentError.message}{" "}
                        <Text
                          style={styles.errorShowMore}
                          onPress={openErrorDetailsModal}
                        >
                          (show more)
                        </Text>
                      </Text>
                      {isDefined(gasEstimateError) && (
                        <Text
                          style={styles.gasEstimateRetryButton}
                          onPress={async () => {
                            setError(undefined);
                            resetProofAndGas();
                          }}
                        >
                          Tap to retry gas estimate
                        </Text>
                      )}
                    </>
                  )}
                {requiresProofGeneration && !hasValidProof && (
                  <View style={styles.bottomButtonWrapper}>
                    <ButtonWithTextAndIcon
                      icon="calculator"
                      title="Generate Proof"
                      onPress={() => {
                        triggerHaptic(HapticSurface.SelectItem);
                        setHasBroadcasterError(false);
                        setError(undefined);
                        tryGenerateProof();
                      }}
                      disabled={disableProofGeneration}
                    />
                  </View>
                )}
                {requiresProofGeneration &&
                  hasValidProof &&
                  isDefined(proofExpirationSeconds) && (
                    <Text style={styles.bottomButtonProofExpirationText}>
                      Proof valid for {proofExpirationSeconds} seconds.
                    </Text>
                  )}
                {hasBroadcasterError &&
                  selectedBroadcaster &&
                  hasValidProof && (
                    <>
                      <View style={styles.bottomButtonWrapper}>
                        <ButtonWithTextAndIcon
                          icon="refresh"
                          title="Retry transaction"
                          onPress={onTapRetryBroadcasterTransaction}
                        />
                      </View>
                    </>
                  )}
              </>
            )}
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
      {!disableSendButton && !hideSendButton ? (
        <FooterButtonAndroid
          buttonAction={onTapSend}
          buttonTitle={confirmButtonText}
        />
      ) : null}
      {isDefined(currentError) && (
        <ErrorDetailsModal
          show={showErrorDetailsModal}
          error={currentError}
          onDismiss={dismissErrorDetailsModal}
        />
      )}
      <GenericAlert {...alert} />
    </>
  );
};
