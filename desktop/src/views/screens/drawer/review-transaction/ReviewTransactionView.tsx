import {
  LiquidityV2Pool,
  RecipeOutput,
  SwapQuoteData,
} from '@railgun-community/cookbook';
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
} from '@railgun-community/shared-models';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import cn from 'classnames';
import { ContractTransaction, TransactionResponse } from 'ethers';
import {
  ActionSheetOption,
  StyledActionSheet,
} from '@components/ActionSheet/StyledActionSheet';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { DrawerBackButton } from '@components/drawer-back-button/DrawerBackButton';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Input } from '@components/Input/Input';
import { SelectableListItem } from '@components/SelectableListItem/SelectableListItem';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import { ActionSheetRef } from '@railway-developer/actionsheet-react';
import {
  addSkippedBroadcaster,
  AdjustedERC20AmountRecipientGroup,
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
} from '@react-shared';
import { ErrorDetailsModal } from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { GenerateProofModal } from '@screens/modals/GenerateProofModal/GenerateProofModal';
import { ProcessTransactionModal } from '@screens/modals/ProcessTransactionModal/ProcessTransactionModal';
import { SelectNetworkFeeModal } from '@screens/modals/SelectNetworkFeeModal/SelectNetworkFeeModal';
import { SelectERC20Modal } from '@screens/modals/SelectTokenModal/SelectERC20Modal';
import { SelectWalletModal } from '@screens/modals/SelectWalletModal/SelectWalletModal';
import { IconType, renderIcon } from '@services/util/icon-service';
import {
  createPOIDisclaimerAlert,
  createPublicBroadcasterDisclaimerAlert,
  createSelfBroadcastDisclaimerAlert,
} from '@utils/alerts';
import { Constants } from '@utils/constants';
import { ProgressBar } from '@views/components/ProgressBar/ProgressBar';
import { SelectBroadcasterModal } from '@views/screens/modals/SelectBroadcasterModal/SelectBroadcasterModal';
import { ReviewTransactionReviewSection } from './ReviewTransactionReviewSection/ReviewTransactionReviewSection';
import styles from './ReviewTransaction.module.scss';

type Props = {
  goBack?: () => void;
  backButtonText?: string;
  confirmButtonText: string;
  getGasEstimate: GetGasEstimateSelfSigned | GetGasEstimateProofRequired;
  performTransaction: PerformTransactionType;
  performGenerateProof?: PerformGenerateProofType;
  fromWalletAddress: string;
  onSuccessCallback: () => void;
  isFullyPrivateTransaction: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  erc20AmountRecipients: ERC20AmountRecipient[];
  nftAmountRecipients: NFTAmountRecipient[];
  infoCalloutText: string;
  processingText: string;
  hideTokenAmounts?: boolean;
  transactionType: TransactionType;
  cancelTxResponse?: TransactionResponse;
  setHasValidProof?: (hasProof: boolean) => void;
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
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  ) => void;
  onTransactionGasDetailsUpdate?: (
    gasDetails: Optional<TransactionGasDetails>,
  ) => void;
  recipeOutput?: RecipeOutput;
  vault?: Vault;
  receivedMinimumAmounts?: ERC20Amount[];
  requireSelfSigned?: boolean;

  pool?: LiquidityV2Pool
  setSlippagePercent?: (slippage: number) => void;
  slippagePercent?: number;
};

export const ReviewTransactionView: React.FC<Props> = ({
  goBack,
  confirmButtonText,
  getGasEstimate,
  performTransaction,
  performGenerateProof,
  fromWalletAddress,
  onSuccessCallback,
  isFullyPrivateTransaction,
  balanceBucketFilter,
  erc20AmountRecipients,
  nftAmountRecipients,
  infoCalloutText,
  processingText,
  hideTokenAmounts,
  transactionType,
  backButtonText,
  cancelTxResponse,
  recipeOutput,
  setHasValidProof: setParentHasValidProof,
  swapQuote,
  swapBuyTokenAmount,
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
  receivedMinimumAmounts,
  requireSelfSigned,
  onBroadcasterFeeUpdate,
  onTransactionGasDetailsUpdate,
  setSlippagePercent,
  slippagePercent,
  vault,
  pool,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { txidVersion } = useReduxSelector('txidVersion');
  const { remoteConfig } = useReduxSelector('remoteConfig');

  const dispatch = useAppDispatch();

  const [gasEstimateProgress, setGasEstimateProgress] = useState(0);

  const [transactionSuccessTxid, setTransactionSuccessTxid] =
    useState<Optional<string>>();
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showProofTimerExpiredOnFail, setShowProofTimerExpiredOnFail] =
    useState(false);

  const [error, setError] = useState<Optional<Error>>();

  const [hasBroadcasterError, setHasBroadcasterError] = useState(false);

  const [showNetworkFeeModal, setShowNetworkFeeModal] = useState(false);
  const [showWalletSelectorModal, setShowWalletSelectorModal] = useState(false);
  const [showBroadcasterSelectorModal, setShowBroadcasterSelectorModal] =
    useState(false);
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false);

  const [signerType, setSignerType] = useState<Optional<SignerType>>();
  const [customNonce, setCustomNonce] = useState<Optional<number>>();
  const [publicWalletOverride, setPublicWalletOverride] =
    useState<Optional<AvailableWallet>>();
  const [forceBroadcaster, setForceBroadcaster] =
    useState<Optional<SelectedBroadcaster>>();
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);

  const [shieldedTransferMemoEntry, setShieldedTransferMemoEntry] =
    useState<Optional<string>>();
  const [shieldedTransferMemo, setShieldedTransferMemo] =
    useState<Optional<string>>();

  const [showSenderAddressToRecipient, setShowSenderAddressToRecipient] =
    useState(true);

  const [customGasTransactionDetails, setCustomGasTransactionDetails] =
    useState<Optional<CustomGasTransactionDetails>>();

  const [actionSheetTitle, setActionSheetTitle] = useState('');
  const [actionSheetOptions, setActionSheetOptions] = useState<
    ActionSheetOption[]
  >([]);

  const broadcasterFeeIsEstimatingRef = useRef(false);
  const networkFeeIsEstimatingRef = useRef(false);
  const hasSeenPOIShieldDisclaimer = useRef(false);

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [externalLinkAlert, setExternalLinkAlert] = useState<
    AlertProps | undefined
  >(undefined);

  const { isShieldedFromAddress, isShieldedToAddress } =
    isShieldedFromToAddress(transactionType, isFullyPrivateTransaction);

  const isRailgunShieldedTransfer =
    isShieldedFromAddress && transactionType === TransactionType.Send;
  const requiresProofGeneration = isShieldedFromAddress;

  const { nextTransactionNonce } = useNextTransactionNonce(
    fromWalletAddress,
    isShieldedFromAddress,
    publicWalletOverride,
  );

  const { calculateFeesError } = useRailgunFees(
    transactionType,
    isFullyPrivateTransaction,
  );

  const { hasPendingTransaction } = useHasPendingTransaction(
    publicWalletOverride,
    fromWalletAddress,
    isShieldedFromAddress,
    transactionSuccessTxid,
  );

  const { poiRequired } = usePOIRequiredForCurrentNetwork();

  useEffect(() => {
    const check = async () => {
      const hasSeen = await StorageService.getItem(
        SharedConstants.HAS_SEEN_POI_SHIELD_DISCLAIMER,
      );

      hasSeenPOIShieldDisclaimer.current = isDefined(hasSeen);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    check();
  }, []);

  useEffect(() => {
    if (showProofTimerExpiredOnFail) {
      if (!showProcessModal) {
        setAlert({
          title: 'Proof expired',
          message: 'Please prove your transaction again.',
          onClose: () => setAlert(undefined),
        });
        invalidateProof();
      }
      setShowProofTimerExpiredOnFail(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProcessModal, showProofTimerExpiredOnFail]);

  const proofTimerExpired = () => {
    setShowProofTimerExpiredOnFail(true);
  };

  const actionSheetRef = useRef<ActionSheetRef>();

  const { isMounted } = useIsMounted();

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
    forceBroadcaster,
  );

  const isBroadcasterTransaction =
    requiresBroadcaster && requireSelfSigned !== true && !publicWalletOverride;
  const sendWithPublicWallet = !isBroadcasterTransaction;

  const updateGasEstimateProgress = (amount: number) => {
    setGasEstimateProgress(amount);
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
    selectedFeeToken,
    recipeOutput,
    balanceBucketFilter
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
    gasEstimateError,
  );

  useEffect(() => {
    const networkFeeIsEstimating =
      networkFeeText === SharedConstants.ESTIMATING_GAS_FEE_TEXT;
    const networkFeeEstimatingFinished =
      networkFeeIsEstimatingRef.current && !networkFeeIsEstimating;
    const broadcasterFeeEstimatingFinished =
      broadcasterFeeIsEstimatingRef.current && !broadcasterFeeIsEstimating;

    if (broadcasterFeeEstimatingFinished || networkFeeEstimatingFinished) {
      updateGasEstimateProgress(0);
    }

    networkFeeIsEstimatingRef.current = networkFeeIsEstimating;
    broadcasterFeeIsEstimatingRef.current = broadcasterFeeIsEstimating;
  }, [broadcasterFeeIsEstimating, networkFeeText]);

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
    changeThresholdBasisPoints,
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
      sendWithPublicWallet,
    );

  const finalAdjustedERC20AmountRecipientGroup: AdjustedERC20AmountRecipientGroup =
    useMemo(() => {
      return createAdjustedERC20AmountRecipientGroup(
        adjustedERC20AmountRecipients,
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
      overallBatchMinGasPrice: Optional<bigint>,
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
        overallBatchMinGasPrice,
      );
    },
    [
      crossContractCalls,
      finalAdjustedERC20AmountRecipientGroup.inputs,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      txidVersion,
    ],
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
    validateProvedTransaction,
  );

  useEffect(() => {
    if (setParentHasValidProof)
      setParentHasValidProof(hasValidProof);

    return () => {
      if (setParentHasValidProof) setParentHasValidProof(false);
    };
  }, [hasValidProof, setParentHasValidProof]);

  const { remoteConfigNetworkError } = useRemoteConfigNetworkError(
    transactionType,
    isFullyPrivateTransaction,
    useRelayAdapt,
  );

  const triggerUpdateSwapQuote = useCallback(() => {
    if (updateSwapQuote) {
      invalidateProof();
      updateSwapQuote();
    }
  }, [invalidateProof, updateSwapQuote]);

  const openNetworkFeeSelector = () => {
    if (!gasDetailsMap) {
      logDevError('No gas details map for Network Fee Selector');
      return;
    }
    setShowNetworkFeeModal(true);
  };

  const onDismissNetworkFeeModal = (
    newNetworkFeeSelection?: NetworkFeeSelection,
    customGasTransactionDetails?: CustomGasTransactionDetails,
  ) => {
    if (newNetworkFeeSelection) {
      if (newNetworkFeeSelection === NetworkFeeSelection.Custom) {
        if (!customGasTransactionDetails) {
          logDevError('No custom gas fees provided.');
          return;
        }
        setCustomGasTransactionDetails(customGasTransactionDetails);
      }
      setNetworkFeeSelection(newNetworkFeeSelection);
    }
    setShowNetworkFeeModal(false);
  };

  const openPublicWalletOverrideSelector = () => {
    setShowWalletSelectorModal(true);
  };

  const openErrorDetailsModal = () => {
    setShowErrorDetailsModal(true);
  };
  const dismissErrorDetailsModal = () => {
    setShowErrorDetailsModal(false);
  };

  const onDismissPublicWalletOverrideSelector = (
    wallet?: FrontendWallet,
    _address?: string,
    removeSelectedWallet: boolean = false,
  ) => {
    if (removeSelectedWallet) {
      setPublicWalletOverride(undefined);
    } else if (wallet && !wallet.isViewOnlyWallet) {
      setPublicWalletOverride(wallet);
      setSignerType(SignerType.SelfBroadcast);
    }

    setShowWalletSelectorModal(false);
  };

  const openBroadcasterSelector = () => {
    setShowBroadcasterSelectorModal(true);
  };

  const onDismissBroadcasterSelector = (
    broadcaster: Optional<SelectedBroadcaster>,
    randomBroadcaster: boolean,
  ) => {
    if (broadcaster || randomBroadcaster) {
      setForceBroadcaster(broadcaster);
      setSignerType(SignerType.PublicBroadcaster);
      resetGasData();
    }

    setShowBroadcasterSelectorModal(false);
  };

  const activeWallet = wallets.active;

  const recipeFinalERC20Amounts = useMemo(
    () =>
      createRecipeFinalERC20Amounts(
        activeWallet,
        network.current.name,
        erc20AmountRecipients,
        recipeOutput,
      ),
    [activeWallet, network, recipeOutput, erc20AmountRecipients],
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
    error: Error,
    isBroadcasterError: boolean = false,
  ) => {
    setShowProcessModal(false);
    setError(error);
    setHasBroadcasterError(isBroadcasterError);
  };

  const onTapSend = () => {
    if (
      poiRequired &&
      !hasSeenPOIShieldDisclaimer.current &&
      transactionType === TransactionType.Shield
    ) {
      showLearnMorePOIShield(
        onTapSend,
      );
      return;
    }

    setHasBroadcasterError(false);
    setShowProcessModal(true);
  };

  const onTapRetryBroadcasterTransaction = () => {
    if (sendWithPublicWallet) {
      onTapSend();
      return;
    }

    const railgunAddress = selectedBroadcaster?.railgunAddress;

    setActionSheetTitle(
      `Broadcaster: ${shortenWalletAddress(railgunAddress ?? 'Unknown')}`,
    );
    setActionSheetOptions([
      {
        name: 'Refresh gas and try again',
        action: resetProofAndGas,
      },
      {
        name: 'Retry with a different public broadcaster',
        action: () => skipBroadcaster(railgunAddress),
      },
      {
        name: 'Block this public broadcaster',
        action: () => blockBroadcaster(railgunAddress),
      },
    ]);

    actionSheetRef.current?.open();
  };

  const onTapBroadcasterOptions = () => {
    const noBroadcasterSelected =
      !selectedBroadcaster || !isDefined(gasDetailsMap);

    setActionSheetTitle('Broadcaster options');
    setActionSheetOptions([
      {
        name: 'Select gas fee token',
        action: () => {
          if (forceBroadcaster) {
            setForceBroadcaster(undefined);
            setSignerType(undefined);
            setShowBroadcasterSelectorModal(true);
          }
          selectBroadcasterFeeERC20Modal();
        },
      },
      {
        name: 'Set gas price for transaction',
        action: openNetworkFeeSelector,
        disabled: noBroadcasterSelected,
      },
      {
        name: 'Try with a different Broadcaster',
        action: () => skipBroadcaster(selectedBroadcaster?.railgunAddress),
        disabled: noBroadcasterSelected,
      },
    ]);

    actionSheetRef.current?.open();
  };

  const onSelectBroadcasterOption = (option: ActionSheetOption) => {
    actionSheetRef.current?.close();
    option.action();
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
      setForceBroadcaster(undefined);
    }
    resetProofAndGas();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const blockBroadcaster = async (pubKey?: string) => {
    if (isDefined(pubKey)) {
      const blockedBroadcasterService = new BlockedBroadcasterService(dispatch);
      await blockedBroadcasterService.addBlockedBroadcaster(
        pubKey,
        undefined,
      );
    }
    resetProofAndGas();
  };

  const promptUnlockBroadcaster = () => {
    setAlert({
      title: 'Unlock Broadcaster',
      message: 'Reset proof to unlock gas fee selection.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Confirm',
      onSubmit: () => {
        setAlert(undefined);
        resetProofAndGas();
      },
    });
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
        className={styles.infoCallout}
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
          network.current,
        )}.`;

        return (
          <div className={styles.poiCalloutContainer}>
            <InfoCallout
              text={text}
              ctaButton="Read more"
              type={CalloutType.Secure}
              onCtaPress={() => showLearnMorePOIShield()}
              className={styles.warningInfoCallout}
              borderColor={frontendConfig.backgroundColor}
              gradientColors={frontendConfig.gradientColors}
            />
          </div>
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
            ctaButton="Learn more"
            type={CalloutType.Secure}
            className={styles.warningInfoCallout}
            onCtaPress={showLearnMorePOITransfer}
            borderColor={frontendConfig.backgroundColor}
            gradientColors={frontendConfig.gradientColors}
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
          className={styles.warningInfoCallout}
          borderColor={styleguide.colors.danger}
          gradientColors={styleguide.colors.gradients.redCallout.colors}
        />
      );
    }
    return null;
  };

  const showSelfBroadcastDisclaimer = () => {
    createSelfBroadcastDisclaimerAlert(
      setAlert,
      setExternalLinkAlert,
      dispatch,
    );
  };

  const showPublicBroadcasterDisclaimer = () => {
    createPublicBroadcasterDisclaimerAlert(
      setAlert,
      setExternalLinkAlert,
      dispatch,
    );
  };

  const showLearnMorePOIShield = (callback?: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    StorageService.setItem(SharedConstants.HAS_SEEN_POI_SHIELD_DISCLAIMER, '1');
    hasSeenPOIShieldDisclaimer.current = true;

    createPOIDisclaimerAlert(
      'Shielding',
      getShieldingPOIDisclaimerMessage(network.current),
      setAlert,
      setExternalLinkAlert,
      dispatch,
      remoteConfig?.current?.poiDocumentation,
      callback,
      isDefined(callback) ? 'Continue' : undefined,
    );
  };

  const showLearnMorePOITransfer = () => {
    createPOIDisclaimerAlert(
      'Private Transfer',
      getTransferPOIDisclaimerMessage(),
      setAlert,
      setExternalLinkAlert,
      dispatch,
      remoteConfig?.current?.poiDocumentation,
    );
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

  const editingMemo = shieldedTransferMemo !== shieldedTransferMemoEntry;

  const disableProofGeneration =
    !isDefined(selectedGasDetails) ||
    editingMemo ||
    (!isDefined(publicWalletOverride) &&
      !isDefined(selectedBroadcaster) &&
      requireSelfSigned !== true) ||
    disableSendRequiresNewSwapQuote;

  const currentError: Optional<Error> =
    calculateFeesError ??
    remoteConfigNetworkError ??
    gasTokenBalanceError ??
    error ??
    gasEstimateError;

  const navigateBack = () => {
    dispatch(resetBroadcasterSkiplist());
    goBack && goBack();
  };

  const handleBackButton = () => {
    if (hasValidProof) {
      setAlert({
        title: 'Warning',
        message: 'You will lose your current proof if you navigate away.',
        onClose: () => setAlert(undefined),
        submitTitle: 'Confirm',
        onSubmit: () => {
          setAlert(undefined);
          navigateBack();
        },
      });
      return;
    }
    navigateBack();
  };

  const broadcasterLockedIcon = selectedBroadcasterLocked
    ? renderIcon(IconType.LockClosed, 16, styleguide.colors.gray7())
    : undefined;

  const renderSelectSignerType = () => {
    return (
      <div className={styles.selectSignerTypeContainer}>
        <div className={styles.selectSignerTypeButton}>
          <SelectableListItem
            title="Self Broadcast"
            onTap={openPublicWalletOverrideSelector}
          />
          <Text
            className={styles.selectSignerTypeButtonInfo}
            onClick={showSelfBroadcastDisclaimer}
          >
            What is this?
          </Text>
        </div>
        <div className={styles.selectSignerTypeButton}>
          <SelectableListItem
            title="Public Broadcaster"
            onTap={openBroadcasterSelector}
          />
          <Text
            className={styles.selectSignerTypeButtonInfo}
            onClick={showPublicBroadcasterDisclaimer}
          >
            What is this?
          </Text>
        </div>
      </div>
    );
  };

  return (
    <>
      {goBack && isDefined(backButtonText) && (
        <DrawerBackButton
          text={backButtonText}
          handleBackButton={handleBackButton}
        />
      )}
      <StyledActionSheet
        title={actionSheetTitle}
        actionSheetRef={actionSheetRef}
        actionSheetOptions={actionSheetOptions}
        onSelectOption={onSelectBroadcasterOption}
      />
      {showWalletSelectorModal && (
        <SelectWalletModal
          title="Select signing wallet"
          isRailgunInitial={false}
          selectedWallet={publicWalletOverride}
          onDismiss={onDismissPublicWalletOverrideSelector}
          showBroadcasterOption={false}
          availableWalletsOnly={true}
        />
      )}
      {showBroadcasterSelectorModal && (
        <SelectBroadcasterModal
          onDismiss={() => onDismissBroadcasterSelector(undefined, false)}
          onRandomBroadcaster={() =>
            onDismissBroadcasterSelector(undefined, true)
          }
          onSelectBroadcaster={broadcaster =>
            onDismissBroadcasterSelector(broadcaster, false)
          }
          changeFeeToken={selectBroadcasterFeeERC20Modal}
          selectedBroadcaster={forceBroadcaster}
          allBroadcasters={allBroadcasters}
          feeToken={selectedFeeToken}
        />
      )}
      {showNetworkFeeModal && gasDetailsMap && (
        <SelectNetworkFeeModal
          onDismiss={onDismissNetworkFeeModal}
          currentOption={networkFeeSelection}
          gasDetailsMap={gasDetailsMap}
          defaultCustomGasTransactionDetails={customGasTransactionDetails ?? {}}
          selectedBroadcaster={selectedBroadcaster}
          selectedFeeToken={selectedFeeToken}
          isBroadcasterTransaction={isBroadcasterTransaction}
        />
      )}
      {showBroadcasterFeeERC20Modal && (
        <SelectERC20Modal
          headerTitle="Select fee token"
          skipBaseToken={true}
          onDismiss={onDismissSelectBroadcasterFee}
          isRailgun={true}
          purpose={SelectTokenPurpose.BroadcasterFee}
          transactionType={null}
          useRelayAdaptForBroadcasterFee={useRelayAdapt}
          balanceBucketFilter={balanceBucketFilter}
        />
      )}
      {showGenerateProofModal && (
        <GenerateProofModal
          selectedBroadcaster={selectedBroadcaster}
          broadcasterFeeERC20Amount={broadcasterFeeERC20Amount}
          finalERC20AmountRecipients={
            finalAdjustedERC20AmountRecipientGroup.inputs
          }
          nftAmountRecipients={nftAmountRecipients}
          publicWalletOverride={publicWalletOverride}
          showSenderAddressToRecipient={showSenderAddressToRecipient}
          memoText={shieldedTransferMemo}
          overallBatchMinGasPrice={overallBatchMinGasPrice}
          performGenerateProof={async (
            finalTokenAmounts,
            nftAmountRecipients,
            selectedBroadcaster,
            broadcasterFeeERC20Amount,
            publicWalletOverride,
            showSenderAddressToRecipient,
            memoText,
            overallBatchMinGasPrice,
            success,
            fail,
          ) => {
            setError(undefined);
            if (!performGenerateProof) {
              fail(new Error('No proof generation available.'));
              return;
            }
            await performGenerateProof(
              finalTokenAmounts,
              nftAmountRecipients,
              selectedBroadcaster,
              broadcasterFeeERC20Amount,
              publicWalletOverride,
              showSenderAddressToRecipient,
              memoText,
              overallBatchMinGasPrice,
              success,
              fail,
            );
          }}
          onSuccessClose={onGenerateProofSuccess}
          onFailClose={onGenerateProofFail}
        />
      )}
      {showProcessModal && (
        <ProcessTransactionModal
          performTransaction={async (
            finalAdjustedERC20AmountRecipientGroup,
            nftAmountRecipients,
            selectedBroadcaster,
            broadcasterFeeERC20Amount,
            options,
            customNonce,
            publicWalletOverride,
            showSenderAddressToRecipient,
            memoText,
            success,
            error,
          ) => {
            if (isDefined(transactionSuccessTxid)) {
              const alreadySubmittedError = new Error(
                'Transaction already submitted.',
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
              options,
              customNonce,
              publicWalletOverride,
              showSenderAddressToRecipient,
              memoText,
              success,
              error,
            );
            setTransactionSuccessTxid(txid);
            return txid;
          }}
          finalAdjustedERC20AmountRecipientGroup={
            finalAdjustedERC20AmountRecipientGroup
          }
          nftAmountRecipients={nftAmountRecipients}
          selectedBroadcaster={selectedBroadcaster}
          broadcasterFeeERC20Amount={broadcasterFeeERC20Amount}
          publicWalletOverride={publicWalletOverride}
          transactionGasDetails={selectedGasDetails}
          memoText={shieldedTransferMemo}
          showSenderAddressToRecipient={showSenderAddressToRecipient}
          onSuccessClose={onTransactionSuccess}
          onFailClose={onTransactionFail}
          processingText={processingText}
          successText="Transaction sent"
          customNonce={customNonce}
          showKeepAppOpenText
        />
      )}
      <div className={styles.reviewTransactionViewContainer}>
        <div className={styles.reviewTransactionViewContainer}>
          {infoCallout()}
          {warningInfoCallout()}
          <ReviewTransactionReviewSection
            transactionType={transactionType}
            receivedMinimumAmounts={receivedMinimumAmounts}
            fromWalletAddress={fromWalletAddress}
            adjustedERC20AmountRecipients={adjustedERC20AmountRecipients}
            nftAmountRecipients={nftAmountRecipients}
            hideTokenAmounts={hideTokenAmounts}
            isShieldedFromAddress={isShieldedFromAddress}
            isShieldedToAddress={isShieldedToAddress}
            isFullyPrivateTransaction={isFullyPrivateTransaction}
            cancelTxResponse={cancelTxResponse}
            swapQuote={swapQuote}
            swapBuyTokenAmount={swapBuyTokenAmount}
            swapQuoteOutdated={swapQuoteOutdated}
            swapDestinationAddress={swapDestinationAddress}
            setSwapDestinationAddress={setSwapDestinationAddress}
            updateSwapQuote={triggerUpdateSwapQuote}
            isBaseTokenUnshield={isBaseTokenUnshield}
            recipeFinalERC20Amounts={recipeFinalERC20Amounts}
            setSlippagePercent={setSlippagePercent}
            slippagePercent={slippagePercent}
            vault={vault}
            pool={pool}
          />
          {!isDefined(signerType) &&
            isBroadcasterTransaction &&
            renderSelectSignerType()}
          {(isDefined(signerType) || !isBroadcasterTransaction) && (
            <>
              <div className={styles.networkFeeWrapper}>
                {isBroadcasterTransaction ? (
                  <>
                    <SelectableListItem
                      title="Gas fee"
                      titleIconSource={broadcasterLockedIcon}
                      description={
                        selectedGasDetails && selectedBroadcaster
                          ? `via broadcaster ${shortenWalletAddress(
                              selectedBroadcaster.railgunAddress,
                            )}`
                          : broadcasterFeeIsEstimating
                          ? broadcasterFeeText
                          : ''
                      }
                      rightText={broadcasterFeeText}
                      rightSubtext={broadcasterFeeSubtext}
                      onTap={
                        selectedBroadcasterLocked
                          ? promptUnlockBroadcaster
                          : onTapBroadcasterOptions
                      }
                      evenLeftAndRight
                      customRightView={
                        broadcasterFeeIsEstimating ? (
                          <div
                            className={styles.gasEstimateProgressBarContainer}
                          >
                            <Text className={styles.gasEstimateProgressLabel}>
                              Estimating...
                            </Text>
                            <ProgressBar progress={gasEstimateProgress} />
                          </div>
                        ) : undefined
                      }
                    />
                    {selectedBroadcasterLocked &&
                      gasPriceChangedByThreshold &&
                      !showGenerateProofModal &&
                      !showProcessModal && (
                        <TextButton
                          textClassName={styles.broadcasterFeeWarning}
                          action={resetProofAndGas}
                          text="Gas prices have changed, and your fee may not be
                      valid. Click to update."
                        />
                      )}
                  </>
                ) : (
                  <SelectableListItem
                    title="Gas fee"
                    description={
                      networkFeeText === SharedConstants.ESTIMATING_GAS_FEE_TEXT
                        ? `Paid in ${network.current.baseToken.symbol}`
                        : 'Estimated'
                    }
                    rightText={networkFeeText}
                    rightSubtext={networkFeePriceText}
                    onTap={openNetworkFeeSelector}
                    disabled={!selectedGasDetails}
                    evenLeftAndRight
                    customRightView={
                      networkFeeText ===
                      SharedConstants.ESTIMATING_GAS_FEE_TEXT ? (
                        <div className={styles.gasEstimateProgressBarContainer}>
                          <Text className={styles.gasEstimateProgressLabel}>
                            Estimating...
                          </Text>
                          <ProgressBar progress={gasEstimateProgress} />
                        </div>
                      ) : undefined
                    }
                  />
                )}
              </div>
              {Constants.ENABLE_MEMO_FIELD && isRailgunShieldedTransfer && (
                <div className={styles.textFieldWrapper}>
                  <Input
                    isTextArea={true}
                    placeholder="Private memo (optional)"
                    onChange={e => {
                      invalidateProof();
                      setShieldedTransferMemoEntry(
                        e.target.value.length
                          ? e.target.value.trim()
                          : undefined,
                      );
                    }}
                    rightView={
                      <Button
                        children={editingMemo ? 'UPDATE' : 'SAVED'}
                        onClick={() =>
                          setShieldedTransferMemo(shieldedTransferMemoEntry)
                        }
                        textClassName={styles.bottomButtonLabel}
                        buttonClassName={styles.inputInsetButton}
                        disabled={!editingMemo}
                      />
                    }
                    hasError={editingMemo}
                  />
                </div>
              )}
              {enableAdvancedFields && (
                <>
                  {!showAdvancedOptions && (
                    <TextButton
                      text={
                        showAdvancedOptions
                          ? 'Hide advanced options'
                          : 'Show advanced options'
                      }
                      action={() =>
                        setShowAdvancedOptions(!showAdvancedOptions)
                      }
                      containerClassName={styles.advancedOptionsButton}
                    />
                  )}
                  {showAdvancedOptions && enablePublicWalletOverride && (
                    <div className={styles.textFieldWrapper}>
                      <SelectableListItem
                        title="Signer"
                        titleIconSource={broadcasterLockedIcon}
                        rightText={
                          publicWalletOverride
                            ? publicWalletOverride.name
                            : 'Public Broadcaster'
                        }
                        rightSubtext={
                          publicWalletOverride
                            ? 'Encrypted'
                            : 'Encrypted & anonymous'
                        }
                        onTap={() => {
                          resetProof();
                          setPublicWalletOverride(undefined);
                          setForceBroadcaster(undefined);
                          setSignerType(undefined);
                        }}
                      />
                    </div>
                  )}
                  {showAdvancedOptions && showHideSenderAddress && (
                    <div className={styles.textFieldWrapper}>
                      <SelectableListItem
                        title="Sender address"
                        rightText={
                          showSenderAddressToRecipient ? 'Visible' : 'Hidden'
                        }
                        rightSubtext={
                          showSenderAddressToRecipient
                            ? 'Shown only to receiver'
                            : 'Not seen by anyone'
                        }
                        onTap={() => {
                          resetProof();
                          setShowSenderAddressToRecipient(
                            !showSenderAddressToRecipient,
                          );
                        }}
                        hideRightIcon={true}
                      />
                    </div>
                  )}
                  {showAdvancedOptions &&
                    (showCustomNonce || publicWalletOverride) && (
                      <div className={styles.textFieldWrapper}>
                        <Input
                          placeholder={`Nonce: ${nextTransactionNonce}`}
                          onChange={e =>
                            setCustomNonce(
                              e.target.value.length
                                ? parseInt(e.target.value)
                                : undefined,
                            )
                          }
                          type="number"
                          maxLength={6}
                        />
                      </div>
                    )}
                </>
              )}
              {isDefined(currentError) &&
                !showGenerateProofModal &&
                !showProcessModal && (
                  <>
                    <Text className={cn(styles.errorText, 'selectable-text')}>
                      {currentError.message}
                    </Text>
                    <TextButton
                      containerClassName={styles.showMoreErrorContainer}
                      textClassName={styles.showMoreErrorText}
                      text="Show more"
                      action={openErrorDetailsModal}
                    />
                    {isDefined(gasEstimateError) && (
                      <TextButton
                        textClassName={styles.gasEstimateRetryButton}
                        text="Click to retry gas estimate"
                        action={async () => {
                          setError(undefined);
                          resetProofAndGas();
                        }}
                      />
                    )}
                  </>
                )}
              {requiresProofGeneration && !hasValidProof && (
                <div className={styles.bottomButtonWrapper}>
                  <Button
                    endIcon={IconType.Calculator}
                    children={`Generate Proof`}
                    onClick={() => {
                      setHasBroadcasterError(false);
                      setError(undefined);
                      tryGenerateProof();
                    }}
                    buttonClassName={styles.sendButton}
                    textClassName={styles.sendButtonText}
                    disabled={disableProofGeneration}
                  />
                </div>
              )}
              {requiresProofGeneration &&
                hasValidProof &&
                isDefined(proofExpirationSeconds) && (
                  <div className={styles.bottomButtonWrapper}>
                    <Text className={styles.bottomButtonProofExpirationText}>
                      Proof valid for {proofExpirationSeconds} seconds.
                    </Text>
                  </div>
                )}
              {hasBroadcasterError && selectedBroadcaster && hasValidProof && (
                <div className={styles.bottomButtonWrapper}>
                  <Button
                    endIcon={IconType.Retry}
                    children="Retry transaction"
                    onClick={onTapRetryBroadcasterTransaction}
                    buttonClassName={styles.sendButton}
                    textClassName={styles.sendButtonText}
                  />
                </div>
              )}
              {!hideSendButton && (
                <>
                  {poiInfoCallout()}
                  <div className={styles.bottomButtonWrapper}>
                    <Button
                      onClick={onTapSend}
                      children={confirmButtonText}
                      buttonClassName={styles.sendButton}
                      textClassName={styles.sendButtonText}
                      disabled={disableSendButton}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      {showErrorDetailsModal && isDefined(currentError) && (
        <ErrorDetailsModal
          error={currentError}
          onDismiss={dismissErrorDetailsModal}
        />
      )}
      {alert && <GenericAlert {...alert} />}
      {externalLinkAlert && <GenericAlert {...externalLinkAlert} />}
    </>
  );
};
