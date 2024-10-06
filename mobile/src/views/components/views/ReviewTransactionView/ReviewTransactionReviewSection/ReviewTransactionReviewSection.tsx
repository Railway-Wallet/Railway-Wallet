import { LiquidityV2Pool, SwapQuoteData } from "@railgun-community/cookbook";
import { isDefined } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { TransactionResponse } from "ethers";
import {
  AdjustedERC20AmountRecipients,
  createERC20AmountRecipientGroups,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  formatUnitFromHexStringToLocale,
  FrontendWallet,
  getBaseTokenForNetwork,
  getDecimalBalanceString,
  getPairExchangeRateDisplayText,
  getTokenDisplayName,
  getTokenDisplayNameShort,
  getVaultExchangeRateDisplayText,
  getWrappedTokenForNetwork,
  hasOnlyBaseToken,
  IconPublic,
  IconShielded,
  imageForToken,
  isRailgunAddress,
  logDevError,
  RecipeFinalERC20Amounts,
  shortenWalletAddress,
  styleguide,
  TransactionType,
  useReduxSelector,
  useWalletNameMap,
  Vault,
} from "@react-shared";
import { SelectWalletModal } from "@screens/modals/SelectWalletModal/SelectWalletModal";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { Icon, IconSource } from "@views/components/icons/Icon";
import { LiquiditySettingsModal } from "@views/screens/DApps/Liquidity/LiquiditySettingsModal/LiquiditySettingsModal";
import {
  SwapSettings,
  SwapSettingsModal,
} from "@views/screens/DApps/Swap/SwapSettingsModal/SwapSettingsModal";
import { styles } from "./styles";

type Props = {
  transactionType: TransactionType;
  fromWalletAddress: string;
  adjustedERC20AmountRecipients: AdjustedERC20AmountRecipients[];
  hideTokenAmounts: Optional<boolean>;
  isShieldedFromAddress: boolean;
  isShieldedToAddress: boolean;
  isFullyPrivateTransaction: boolean;
  cancelTxResponse: Optional<TransactionResponse>;
  swapQuote: Optional<SwapQuoteData>;
  swapBuyTokenAmount: Optional<ERC20Amount>;
  swapQuoteOutdated: Optional<boolean>;
  swapDestinationAddress: Optional<string>;
  setSwapDestinationAddress: Optional<
    (destinationAddress: Optional<string>) => void
  >;
  updateSwapQuote: Optional<() => void>;
  isBaseTokenUnshield: Optional<boolean>;
  recipeFinalERC20Amounts?: RecipeFinalERC20Amounts;
  vault?: Vault;
  pool: Optional<LiquidityV2Pool>;
  receivedMinimumAmounts: Optional<ERC20Amount[]>;
  setSlippagePercent?: (slippage: number) => void;
  slippagePercent?: number;
};

export const ReviewTransactionReviewSection: React.FC<Props> = ({
  transactionType,
  fromWalletAddress,
  adjustedERC20AmountRecipients,
  hideTokenAmounts,
  isShieldedFromAddress,
  isShieldedToAddress,
  isFullyPrivateTransaction,
  cancelTxResponse,
  swapQuote,
  swapBuyTokenAmount,
  swapQuoteOutdated,
  swapDestinationAddress,
  setSwapDestinationAddress,
  updateSwapQuote,
  isBaseTokenUnshield,
  recipeFinalERC20Amounts,
  setSlippagePercent,
  slippagePercent,
  receivedMinimumAmounts,
  vault,
  pool,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [showSelectSwapDestinationModal, setShowSelectSwapDestinationModal] =
    useState(false);
  const [showLiquiditySettingsModal, setShowLiquiditySettingsModal] =
    useState(false);
  const [showSwapSettingsModal, setShowSwapSettingsModal] = useState(false);

  const expectedVaultApy = vault
    ? formatNumberToLocaleWithMinDecimals(vault.apy * 100, 2)
    : 0;
  const isFarmFeature =
    transactionType === TransactionType.FarmDeposit ||
    transactionType === TransactionType.FarmRedeem;

  const isLiquidity =
    transactionType === TransactionType.AddLiquidity ||
    transactionType === TransactionType.RemoveLiquidity;

  const isSwap = transactionType === TransactionType.Swap;

  const showOutputAddress = !isDefined(recipeFinalERC20Amounts);

  const inputERC20AmountRecipients: ERC20AmountRecipient[] =
    recipeFinalERC20Amounts
      ? recipeFinalERC20Amounts.inputERC20AmountRecipients
      : adjustedERC20AmountRecipients.map((adjustedERC20AmountRecipient) => {
          return adjustedERC20AmountRecipient.input;
        });

  const outputERC20AmountRecipients: ERC20AmountRecipient[] =
    recipeFinalERC20Amounts
      ? recipeFinalERC20Amounts.outputERC20AmountRecipients
      : adjustedERC20AmountRecipients.map((adjustedERC20AmountRecipient) => {
          return adjustedERC20AmountRecipient.output;
        });
  const outputTokenRecipientGroups = createERC20AmountRecipientGroups(
    outputERC20AmountRecipients
  );

  const { walletNameMap, getWalletName } = useWalletNameMap(
    outputTokenRecipientGroups,
    transactionType,
    isFullyPrivateTransaction
  );

  const isBaseTokenShield =
    transactionType === TransactionType.Shield &&
    hasOnlyBaseToken(inputERC20AmountRecipients);

  const getDestinationToken = (token: ERC20Token): Optional<ERC20Token> => {
    if (isBaseTokenShield) {
      return getWrappedTokenForNetwork(wallets.active, network.current);
    } else if (isBaseTokenUnshield ?? false) {
      return getBaseTokenForNetwork(wallets.active, network.current);
    }
    return token;
  };

  const reviewTokenAmount = (
    tokenAmount: ERC20Amount,
    index: number,
    feeTokenAmount?: ERC20Amount,
    isDestinationToken = false
  ) => {
    const shouldShowFee =
      isDefined(feeTokenAmount) &&
      BigInt(feeTokenAmount.amountString) !== 0n &&
      [TransactionType.Shield, TransactionType.Unshield].includes(
        transactionType
      );

    const token = isDestinationToken
      ? getDestinationToken(tokenAmount.token)
      : tokenAmount.token;
    if (!token) {
      return null;
    }

    return (
      <View key={index}>
        <View style={shouldShowFee ? styles.tokenRowWithFee : styles.tokenRow}>
          <Image source={imageForToken(token)} style={styles.tokenIcon} />
          <Text style={styles.tokenText}>
            {hideTokenAmounts !== true && (
              <Text style={styles.tokenAmount}>
                {formatUnitFromHexStringToLocale(
                  tokenAmount.amountString,
                  token.decimals
                )}{" "}
              </Text>
            )}
            <Text style={styles.tokenSymbol}>
              {getTokenDisplayNameShort(
                token,
                wallets.available,
                network.current.name
              )}
            </Text>
          </Text>
        </View>
        {shouldShowFee &&
          isDefined(feeTokenAmount) &&
          includedFeeAmount(feeTokenAmount)}
      </View>
    );
  };

  const includedFeeAmount = (tokenAmount: ERC20Amount) => {
    const { token } = tokenAmount;
    return (
      <View style={styles.includedFeeRow}>
        <Text style={styles.includedFeeText}>
          {hideTokenAmounts !== true && (
            <Text style={styles.includedFeeTokenAmount}>
              Fee:{" "}
              {formatUnitFromHexStringToLocale(
                tokenAmount.amountString,
                token.decimals
              )}{" "}
              {getTokenDisplayNameShort(
                token,
                wallets.available,
                network.current.name
              )}
            </Text>
          )}
        </Text>
      </View>
    );
  };

  const dismissSelectSwapDestinationModal = (
    _wallet?: FrontendWallet,
    destinationAddress?: string,
    removeSelectedWallet?: boolean
  ) => {
    if (!isDefined(setSwapDestinationAddress)) {
      return;
    }
    if (removeSelectedWallet === true) {
      setSwapDestinationAddress(undefined);
    }
    if (isDefined(destinationAddress)) {
      setSwapDestinationAddress(destinationAddress);
    }
    setShowSelectSwapDestinationModal(false);
  };

  const promptSwapDestinationAddress = () => {
    if (!isDefined(setSwapDestinationAddress)) {
      return;
    }
    setShowSelectSwapDestinationModal(true);
  };

  const modifySlippagePercent = (onPress: () => void) => {
    if (!isDefined(slippagePercent) || !isDefined(setSlippagePercent)) {
      return null;
    }
    return (
      <View style={styles.includedFeeRow}>
        <Text onPress={onPress} style={styles.slippageSelectorTitle}>
          {`Slippage: ${(slippagePercent * 100).toFixed(1)}% (Tap to update)`}
        </Text>
      </View>
    );
  };

  const modifySwapDestinationAddress = () => {
    if (!isDefined(setSwapDestinationAddress)) {
      return null;
    }
    return (
      <View style={styles.includedFeeRow}>
        <Text
          onPress={promptSwapDestinationAddress}
          style={styles.setSwapDestinationAddressButton}
        >
          {isDefined(swapDestinationAddress) ? "Update" : "Add"} destination
          address
        </Text>
      </View>
    );
  };

  const minimumReceivedTokenAmounts = () => {
    if (!receivedMinimumAmounts) {
      return null;
    }

    return (
      <View style={styles.vaultTextWrapper}>
        <Text style={styles.sectionItemTitle}>Minimum received</Text>
        {receivedMinimumAmounts.map((tokenAmount) => {
          const { token, amountString } = tokenAmount;

          return (
            <Text style={styles.includedFeeText}>
              {hideTokenAmounts !== true && (
                <Text style={styles.includedFeeTokenAmount}>
                  {formatUnitFromHexStringToLocale(
                    amountString,
                    token.decimals
                  )}{" "}
                  {getTokenDisplayNameShort(
                    token,
                    wallets.available,
                    network.current.name
                  )}
                </Text>
              )}
            </Text>
          );
        })}
      </View>
    );
  };

  const transactionIcon = (): IconSource => {
    switch (transactionType) {
      case TransactionType.ApproveShield:
      case TransactionType.ApproveSpender:
        return "check-network-outline";
      case TransactionType.Shield:
      case TransactionType.Unshield:
      case TransactionType.Send:
      case TransactionType.FarmDeposit:
      case TransactionType.FarmRedeem:
      case TransactionType.AddLiquidity:
      case TransactionType.RemoveLiquidity:
      case TransactionType.Mint:
        return "arrow-down";
      case TransactionType.Swap:
        return "swap-vertical";
      case TransactionType.Cancel:
        return "close-circle";
    }
  };

  if (!wallets.active) {
    return null;
  }

  const showReceiverWallets = () => {
    switch (transactionType) {
      case TransactionType.ApproveShield:
      case TransactionType.ApproveSpender:
      case TransactionType.Swap:
      case TransactionType.Mint:
      case TransactionType.Cancel:
        return false;
      case TransactionType.Shield:
      case TransactionType.Unshield:
      case TransactionType.Send:
      case TransactionType.AddLiquidity:
      case TransactionType.RemoveLiquidity:
      case TransactionType.FarmDeposit:
      case TransactionType.FarmRedeem:
        return true;
    }
  };

  const originalGasFeesForCancelType0 = (
    cancelTxResponse: TransactionResponse
  ) => {
    const originalGasPrice = cancelTxResponse.gasPrice;

    return (
      <>
        <Text style={styles.cancelOriginalFeeText}>Original gas fees:</Text>
        <Text
          style={Object.assign(
            {},
            styles.cancelTransactionText,
            styles.cancelTransactionID
          )}
        >
          Gas price:{" "}
          {originalGasPrice
            ? getDecimalBalanceString(originalGasPrice, 9)
            : "Unknown"}{" "}
          GWEI
        </Text>
      </>
    );
  };

  const originalGasFeesForCancelType2 = (
    cancelTxResponse: TransactionResponse
  ) => {
    const originalBaseFee = cancelTxResponse.maxFeePerGas;
    const originalPriorityFee = cancelTxResponse.maxPriorityFeePerGas;

    return (
      <>
        <Text style={styles.cancelOriginalFeeText}>Original gas fees:</Text>
        <Text
          style={Object.assign(
            {},
            styles.cancelTransactionText,
            styles.cancelTransactionID
          )}
        >
          Max base fee:{" "}
          {isDefined(originalBaseFee)
            ? getDecimalBalanceString(originalBaseFee, 9)
            : "Unknown"}{" "}
          GWEI
        </Text>
        <Text
          style={Object.assign(
            {},
            styles.cancelTransactionText,
            styles.cancelTransactionID
          )}
        >
          Priority fee:{" "}
          {isDefined(originalPriorityFee)
            ? getDecimalBalanceString(originalPriorityFee, 9)
            : "Unknown"}{" "}
          GWEI
        </Text>
      </>
    );
  };

  const walletIcon = (showShield: boolean) => {
    if (showShield) {
      return (
        <Icon
          size={15}
          source={IconShielded()}
          color={styleguide.colors.txGreen()}
        />
      );
    }
    return (
      <Icon
        size={15}
        source={IconPublic()}
        color={styleguide.colors.labelSecondary}
      />
    );
  };

  if (transactionType === TransactionType.Cancel) {
    if (!cancelTxResponse) {
      return null;
    }
    const gasToken = network.current.baseToken;
    if (gasToken.decimals !== 18) {
      logDevError(new Error("Gas token decimals must be 18"));
      return null;
    }

    return (
      <View style={styles.reviewSection}>
        <View style={styles.walletNameIconWrapper}>
          {walletIcon(isShieldedFromAddress)}
          <Text style={styles.walletNameText}>
            {wallets.active.name} ({shortenWalletAddress(fromWalletAddress)})
          </Text>
        </View>
        <View style={styles.erc20AmountsWrapper}>
          <Text style={styles.cancelTransactionText}>
            Cancel pending transaction:{" "}
          </Text>
          <Text
            style={Object.assign(
              {},
              styles.cancelTransactionText,
              styles.cancelTransactionID
            )}
          >
            {cancelTxResponse?.hash ?? "N/A"}
          </Text>
          {/* eslint-disable-next-line eqeqeq */}
          {cancelTxResponse.type == 0 &&
            originalGasFeesForCancelType0(cancelTxResponse)}
          {cancelTxResponse.type === 2 &&
            originalGasFeesForCancelType2(cancelTxResponse)}
        </View>
      </View>
    );
  }

  const getWalletNameFromMap = (isRailgunWallet: boolean, address: string) => {
    if (walletNameMap[address]) {
      return walletNameMap[address];
    }
    return getWalletName(isRailgunWallet, address);
  };

  const outputAddress = (isRailgunWallet: boolean, address: string) => {
    const showShieldIcon = isDefined(swapDestinationAddress)
      ? false
      : isShieldedToAddress;
    return (
      <View style={styles.walletNameIconWrapper}>
        {walletIcon(showShieldIcon)}
        <Text style={styles.walletNameText}>
          {`${getWalletNameFromMap(
            isRailgunWallet,
            address
          )} (${shortenWalletAddress(address)})`}
        </Text>
      </View>
    );
  };

  const showPrivateSwapDestination = () => {
    if (!isDefined(swapDestinationAddress)) {
      return true;
    }
    return isRailgunAddress(swapDestinationAddress);
  };

  const openLiquiditySettings = () => {
    setShowLiquiditySettingsModal(true);
  };

  const openSwapSettings = () => {
    setShowSwapSettingsModal(true);
  };

  const onDismissSwapSettings = (newSettings?: SwapSettings) => {
    if (newSettings && isDefined(setSlippagePercent)) {
      setSlippagePercent(newSettings.slippagePercentage);
      triggerHaptic(HapticSurface.EditSuccess);
    }
    setShowSwapSettingsModal(false);
  };

  const showLiquiditySlippageSelector =
    isLiquidity && isDefined(slippagePercent) && isDefined(setSlippagePercent);

  const showSwapSlippageSelector =
    isSwap && isDefined(slippagePercent) && isDefined(setSlippagePercent);

  return (
    <>
      <SelectWalletModal
        show={showSelectSwapDestinationModal}
        title="Select swap destination"
        isRailgunInitial={showPrivateSwapDestination()}
        onDismiss={dismissSelectSwapDestinationModal}
        selectedAddress={swapDestinationAddress}
        availableWalletsOnly
        showNoDestinationWalletOption
        showCustomAddressDestinationOption
        showSavedAddresses
        showPublicPrivateToggle
        closeModal={() => setShowSelectSwapDestinationModal(false)}
      />
      {showLiquiditySlippageSelector && (
        <LiquiditySettingsModal
          show={showLiquiditySettingsModal}
          setFinalSlippagePercentage={setSlippagePercent}
          initialSlippagePercentage={slippagePercent}
          onClose={() => setShowLiquiditySettingsModal(false)}
        />
      )}
      {showSwapSlippageSelector && (
        <SwapSettingsModal
          show={showSwapSettingsModal}
          isRailgun={isRailgunAddress(fromWalletAddress)}
          currentSettings={{ slippagePercentage: slippagePercent }}
          onDismiss={onDismissSwapSettings}
        />
      )}
      <View style={styles.reviewSection}>
        <View style={styles.walletNameIconWrapper}>
          {walletIcon(isShieldedFromAddress)}
          <Text style={styles.walletNameText}>
            {wallets.active.name} ({shortenWalletAddress(fromWalletAddress)})
          </Text>
        </View>
        <View style={styles.erc20AmountsWrapper}>
          {recipeFinalERC20Amounts
            ? inputERC20AmountRecipients.map((tokenAmount, index) => {
                return reviewTokenAmount(tokenAmount, index);
              })
            : adjustedERC20AmountRecipients.map(
                (adjustedTokenAmount, index) => {
                  return reviewTokenAmount(
                    adjustedTokenAmount.input,
                    index,
                    adjustedTokenAmount.fee
                  );
                }
              )}
        </View>
        {showReceiverWallets() &&
          outputTokenRecipientGroups.map((tokenRecipientGroup) => {
            return (
              <View key={tokenRecipientGroup.recipientAddress}>
                <View style={styles.arrowIconWrapper}>
                  <Icon source={transactionIcon()} size={24} color="white" />
                </View>
                {showOutputAddress &&
                  outputAddress(
                    isFullyPrivateTransaction,
                    tokenRecipientGroup.recipientAddress
                  )}
                <View style={styles.erc20AmountsWrapper}>
                  {tokenRecipientGroup.tokenAmounts.map(
                    (outputTokenAmount, index) => {
                      return reviewTokenAmount(
                        outputTokenAmount,
                        index,
                        undefined,
                        true
                      );
                    }
                  )}
                </View>
              </View>
            );
          })}
        {isSwap && swapQuote && swapBuyTokenAmount && (
          <>
            <View style={styles.arrowIconWrapper}>
              <Icon source={transactionIcon()} size={24} color="white" />
            </View>
            {isDefined(swapDestinationAddress) &&
              outputAddress(false, swapDestinationAddress)}
            <View style={styles.erc20AmountsWrapper}>
              {reviewTokenAmount(swapBuyTokenAmount, 0, undefined, true)}
              {modifySwapDestinationAddress()}
              {modifySlippagePercent(openSwapSettings)}
              {minimumReceivedTokenAmounts()}
            </View>
            {(swapQuoteOutdated ?? false) && updateSwapQuote && (
              <View style={styles.swapPriceUpdatedContainer}>
                <Text
                  onPress={updateSwapQuote}
                  style={styles.swapPriceUpdatedButton}
                >
                  Price outdated. Tap to refresh.
                </Text>
              </View>
            )}
          </>
        )}
        {isFarmFeature && (
          <View style={styles.vaultTextWrapper}>
            <Text style={styles.vaultExchangeRateText}>
              {getVaultExchangeRateDisplayText(vault, transactionType)}
            </Text>
            <Text
              style={styles.vaultApyText}
            >{`Current APY: ${expectedVaultApy}%`}</Text>
          </View>
        )}
        {isLiquidity && (
          <>
            <View style={styles.vaultTextWrapper}>
              <Text style={styles.vaultExchangeRateText}>
                {getPairExchangeRateDisplayText(pool)}
              </Text>
            </View>
            {modifySlippagePercent(openLiquiditySettings)}
            {minimumReceivedTokenAmounts()}
          </>
        )}
        {(recipeFinalERC20Amounts?.feeERC20AmountRecipients?.length ?? 0) >
          0 && (
          <View style={styles.recipeFeeWrapper}>
            {recipeFinalERC20Amounts?.feeERC20AmountRecipients.map(
              (feeERC20Amount, index) => {
                const { amountString, recipientAddress, token } =
                  feeERC20Amount;
                const amount = formatUnitFromHexStringToLocale(
                  amountString,
                  token.decimals
                );
                return (
                  <View style={styles.recipeFeeTextWrapper} key={index}>
                    <Text style={styles.sectionItemTitle}>
                      {recipientAddress}
                    </Text>
                    <Text
                      style={styles.recipeFeeAmount}
                    >{`${amount} ${getTokenDisplayName(
                      token,
                      wallets.available,
                      network.current.name
                    )}`}</Text>
                  </View>
                );
              }
            )}
          </View>
        )}
      </View>
    </>
  );
};
