import {
  calculateMaximumGas,
  calculateTotalGas,
  isDefined,
  Network,
  NetworkName,
  ProofType,
  SelectedBroadcaster,
  TransactionGasDetails,
} from "@railgun-community/shared-models";
import { formatUnits } from "ethers";
import { BroadcasterFeeInfo } from "../models/broadcaster";
import {
  AdjustedERC20AmountRecipientGroup,
  AdjustedERC20AmountRecipients,
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20BalancesSerialized,
  ERC20Token,
} from "../models/token";
import { TransactionType } from "../models/transaction";
import { AvailableWallet } from "../models/wallet";
import { NetworkTokenPriceState } from "../redux-store/reducers/network-price-reducer";
import { ProviderService } from "../services/providers/provider-service";
import { AppSettingsService } from "../services/settings/app-settings-service";
import {
  compareTokenAddress,
  compareTokens,
  getTokenBalanceSerialized,
  getTokenDisplayName,
} from "./tokens";
import {
  formatGasFeeForCurrency,
  formatNumberToLocale,
  roundStringToNDecimals,
} from "./util";

export const getProofTypeFromTransactionType = (
  transactionType: TransactionType,
  isBaseTokenWithdraw: boolean
) => {
  switch (transactionType) {
    case TransactionType.Send:
      return ProofType.Transfer;
    case TransactionType.Unshield:
      return isBaseTokenWithdraw
        ? ProofType.UnshieldBaseToken
        : ProofType.Unshield;
    case TransactionType.Swap:
    case TransactionType.FarmDeposit:
    case TransactionType.FarmRedeem:
    case TransactionType.AddLiquidity:
    case TransactionType.RemoveLiquidity:
      return ProofType.CrossContractCalls;
    case TransactionType.ApproveShield:
    case TransactionType.ApproveSpender:
    case TransactionType.Mint:
    case TransactionType.Cancel:
    case TransactionType.Shield: {
      const msg = `No proof type for ${transactionType} transaction`;
      throw new Error(msg);
    }
  }
};

export const isShieldedFromToAddress = (
  transactionType: TransactionType,
  isPrivateTransaction: boolean
): { isShieldedFromAddress: boolean; isShieldedToAddress: boolean } => {
  switch (transactionType) {
    case TransactionType.FarmDeposit:
    case TransactionType.FarmRedeem:
    case TransactionType.AddLiquidity:
    case TransactionType.RemoveLiquidity:
    case TransactionType.Send:
    case TransactionType.Swap:
      return {
        isShieldedFromAddress: isPrivateTransaction,
        isShieldedToAddress: isPrivateTransaction,
      };
    case TransactionType.Unshield:
      return {
        isShieldedFromAddress: true,
        isShieldedToAddress: false,
      };
    case TransactionType.Shield:
      return {
        isShieldedFromAddress: false,
        isShieldedToAddress: true,
      };
    case TransactionType.ApproveShield:
    case TransactionType.ApproveSpender:
    case TransactionType.Mint:
    case TransactionType.Cancel:
      return {
        isShieldedFromAddress: false,
        isShieldedToAddress: false,
      };
  }
};

export const getRawProviderGasPrice = async (
  networkName: NetworkName
): Promise<bigint> => {
  const provider = await ProviderService.getFirstProvider(networkName);
  const gasPrice: bigint = BigInt(await provider.send("eth_gasPrice", []));
  if (!isDefined(gasPrice)) {
    throw new Error("Gas price not found");
  }
  return gasPrice;
};

export const getProviderGasPrice = async (
  networkName: NetworkName
): Promise<bigint> => {
  const provider = await ProviderService.getProvider(networkName);
  const { gasPrice } = await provider.getFeeData();
  if (gasPrice == null) {
    throw new Error("Gas price not found");
  }
  return gasPrice;
};

export const adjustERC20AmountsForShieldUnshield = (
  erc20AmountRecipients: ERC20AmountRecipient[],
  transactionType: TransactionType,
  depositFeeBasisPoints: string,
  withdrawFeeBasisPoints: string,
  gasDetails: Optional<TransactionGasDetails>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  tokenBalancesSerialized: ERC20BalancesSerialized,
  sendWithPublicWallet: boolean
): AdjustedERC20AmountRecipientGroup => {
  const allAdjusted: AdjustedERC20AmountRecipients[] = [];
  for (const erc20AmountRecipient of erc20AmountRecipients) {
    const { token } = erc20AmountRecipient;
    const tokenBalanceSerialized = getTokenBalanceSerialized(
      token,
      tokenBalancesSerialized
    );

    allAdjusted.push(
      adjustERC20AmountRecipientForTransaction(
        erc20AmountRecipient,
        transactionType,
        false,
        gasDetails,
        broadcasterFeeERC20Amount,
        depositFeeBasisPoints,
        withdrawFeeBasisPoints,
        tokenBalanceSerialized,
        sendWithPublicWallet
      )
    );
  }
  return createAdjustedERC20AmountRecipientGroup(allAdjusted);
};

export const createAdjustedERC20AmountRecipientGroup = (
  adjustedERC20AmountRecipients: AdjustedERC20AmountRecipients[]
) => {
  const allFees: ERC20Amount[] = adjustedERC20AmountRecipients.map(
    (ar) => ar.fee
  );
  const allInputs: ERC20AmountRecipient[] = adjustedERC20AmountRecipients.map(
    (ar) => ar.input
  );
  const allOutputs: ERC20AmountRecipient[] = adjustedERC20AmountRecipients.map(
    (ar) => ar.output
  );
  return { fees: allFees, inputs: allInputs, outputs: allOutputs };
};

export const maxBalanceAvailableToShield = (
  maxBalance: bigint,
  _depositFeeBasisPoints: string
): bigint => {
  return maxBalance;
};

const calculateFee = (amount: bigint, feeBasisPoints: string): bigint => {
  return (amount * BigInt(feeBasisPoints)) / 10000n;
};

export const adjustERC20AmountRecipientForTransaction = (
  erc20AmountRecipient: ERC20AmountRecipient,
  transactionType: TransactionType,
  isFullyPrivateTransaction: boolean,
  gasDetails: Optional<TransactionGasDetails>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  depositFeeBasisPoints: string,
  withdrawFeeBasisPoints: string,
  tokenBalanceSerialized: string,
  sendWithPublicWallet: boolean
): AdjustedERC20AmountRecipients => {
  switch (transactionType) {
    case TransactionType.Send:
      return adjustERC20AmountForSendTransaction(
        erc20AmountRecipient,
        isFullyPrivateTransaction,
        gasDetails,
        broadcasterFeeERC20Amount,
        tokenBalanceSerialized,
        sendWithPublicWallet
      );
    case TransactionType.Shield:
    case TransactionType.Unshield:
      return adjustERC20AmountForShieldUnshield(
        erc20AmountRecipient,
        transactionType,
        depositFeeBasisPoints,
        withdrawFeeBasisPoints,
        gasDetails,
        broadcasterFeeERC20Amount,
        tokenBalanceSerialized,
        sendWithPublicWallet
      );
    case TransactionType.ApproveShield:
    case TransactionType.Swap:
    case TransactionType.FarmDeposit:
    case TransactionType.FarmRedeem:
    case TransactionType.AddLiquidity:
    case TransactionType.RemoveLiquidity:
    case TransactionType.ApproveSpender:
    case TransactionType.Mint:
    case TransactionType.Cancel:
      return {
        input: erc20AmountRecipient,
        output: erc20AmountRecipient,
        fee: {
          ...erc20AmountRecipient,
          amountString: "0",
        },
        isMax: false,
      };
  }
};

const adjustERC20AmountForSendTransaction = (
  erc20AmountRecipient: ERC20AmountRecipient,
  isFullyPrivateTransaction: boolean,
  gasDetails: Optional<TransactionGasDetails>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  tokenBalanceSerialized: string,
  sendWithPublicWallet: boolean
): AdjustedERC20AmountRecipients => {
  const {
    amountString,
    token,
    recipientAddress,
    externalUnresolvedToWalletAddress,
  } = erc20AmountRecipient;
  const selectedAmount = BigInt(amountString);

  let input = selectedAmount;
  let output = selectedAmount;

  let isMax = false;
  const currentBalance = BigInt(tokenBalanceSerialized ?? 0);

  if (
    !isFullyPrivateTransaction &&
    (token.isBaseToken ?? false) &&
    gasDetails
  ) {
    const totalGas = calculateMaximumGas(gasDetails);
    isMax = selectedAmount + totalGas >= currentBalance;

    if (isMax && totalGas <= currentBalance) {
      input = currentBalance - totalGas;
      output = currentBalance - totalGas;
    }
  } else if (
    isFullyPrivateTransaction &&
    !sendWithPublicWallet &&
    broadcasterFeeERC20Amount &&
    compareTokens(broadcasterFeeERC20Amount.token, token)
  ) {
    const broadcasterFee = BigInt(broadcasterFeeERC20Amount.amountString);
    isMax = selectedAmount + broadcasterFee >= currentBalance;

    if (isMax && broadcasterFee <= currentBalance) {
      input = currentBalance - broadcasterFee;
      output = currentBalance - broadcasterFee;
    }
  }

  return {
    input: {
      token,
      amountString: input.toString(),
      recipientAddress,
      externalUnresolvedToWalletAddress,
    },
    output: {
      token,
      amountString: output.toString(),
      recipientAddress,
      externalUnresolvedToWalletAddress,
    },
    fee: {
      token,
      amountString: "0",
    },
    isMax,
  };
};

const adjustERC20AmountForShieldUnshield = (
  erc20AmountRecipient: ERC20AmountRecipient,
  transactionType: TransactionType,
  depositFeeBasisPoints: string,
  withdrawFeeBasisPoints: string,
  gasDetails: Optional<TransactionGasDetails>,
  broadcasterFeeERC20Amount: Optional<ERC20Amount>,
  tokenBalanceSerialized: string,
  sendWithPublicWallet: boolean
): AdjustedERC20AmountRecipients => {
  let input: bigint, output: bigint, fee: bigint;

  const {
    amountString,
    token,
    recipientAddress,
    externalUnresolvedToWalletAddress,
  } = erc20AmountRecipient;
  const selectedAmount = BigInt(amountString);
  let gasAdjustedAmount = selectedAmount;

  let isMax = false;
  const currentBalance = BigInt(tokenBalanceSerialized ?? 0);

  switch (transactionType) {
    case TransactionType.Shield: {
      if ((token.isBaseToken ?? false) && gasDetails) {
        const totalGas = calculateMaximumGas(gasDetails);
        isMax = selectedAmount + totalGas >= currentBalance;

        if (isMax && totalGas <= currentBalance) {
          gasAdjustedAmount = currentBalance - totalGas;
        }
      }

      fee = calculateFee(gasAdjustedAmount, depositFeeBasisPoints);
      input = gasAdjustedAmount;
      output = gasAdjustedAmount - fee;
      break;
    }
    case TransactionType.Unshield: {
      if (
        broadcasterFeeERC20Amount &&
        !sendWithPublicWallet &&
        compareTokens(broadcasterFeeERC20Amount.token, token)
      ) {
        const broadcasterFee = BigInt(broadcasterFeeERC20Amount.amountString);
        isMax = selectedAmount + broadcasterFee >= currentBalance;

        if (isMax && broadcasterFee <= currentBalance) {
          gasAdjustedAmount = currentBalance - broadcasterFee;
        }
      }

      fee = calculateFee(gasAdjustedAmount, withdrawFeeBasisPoints);
      input = gasAdjustedAmount;
      output = gasAdjustedAmount - fee;
      break;
    }
    default:
      throw new Error(
        "Please choose transaction type Shield or Unshield for this fee calculation."
      );
  }

  return {
    input: {
      token,
      amountString: input.toString(),
      recipientAddress,
      externalUnresolvedToWalletAddress,
    },
    output: {
      token,
      amountString: output.toString(),
      recipientAddress,
      externalUnresolvedToWalletAddress,
    },
    fee: {
      token,
      amountString: fee.toString(),
    },
    isMax,
  };
};

const formattedFeeTokenPrice = (
  network: Network,
  networkPrices: NetworkTokenPriceState,
  tokenFeeString: string,
  tokenAddress: string,
  showExactCurrencyGasPrice: boolean
) => {
  const tokenPrices =
    networkPrices.forNetwork[network.name]?.forCurrency[
      AppSettingsService.currency.code
    ];
  if (!isDefined(tokenPrices)) {
    return "N/A";
  }
  const tokenPrice = tokenPrices[tokenAddress.toLowerCase()];
  return formatGasFeeForCurrency(
    tokenPrice,
    Number(tokenFeeString),
    showExactCurrencyGasPrice
  );
};

export const networkGasText = (
  network: Network,
  networkPrices: NetworkTokenPriceState,
  gasDetails: TransactionGasDetails,
  showExactCurrencyGasPrice: boolean
) => {
  const totalGas: bigint = calculateTotalGas(gasDetails);
  const gasAmountString = formatUnits(totalGas, network.baseToken.decimals);

  const priceText = formattedFeeTokenPrice(
    network,
    networkPrices,
    gasAmountString,
    network.baseToken.wrappedAddress,
    showExactCurrencyGasPrice
  );

  return {
    networkFeeText: `${formatNumberToLocale(
      roundStringToNDecimals(gasAmountString, 10)
    )} ${network.baseToken.symbol}`,
    networkFeePriceText: priceText,
  };
};

export const broadcasterFeeInfoText = (
  availableWallets: Optional<AvailableWallet[]>,
  network: Network,
  networkPrices: NetworkTokenPriceState,
  selectedBroadcaster: SelectedBroadcaster,
  selectedFeeToken: ERC20Token,
  gasDetails: TransactionGasDetails,
  showExactCurrencyGasPrice: boolean
): Optional<BroadcasterFeeInfo> => {
  if (
    !isDefined(selectedFeeToken) ||
    !isDefined(selectedBroadcaster) ||
    !compareTokenAddress(
      selectedFeeToken.address,
      selectedBroadcaster.tokenAddress
    )
  ) {
    return undefined;
  }

  const tokenFeePerUnitGas = BigInt(selectedBroadcaster.tokenFee.feePerUnitGas);

  const oneUnitGas = 10n ** 18n;
  const maximumGas = calculateMaximumGas(gasDetails);
  const tokenFee = (tokenFeePerUnitGas * maximumGas) / oneUnitGas;
  const tokenFeeString = formatUnits(tokenFee, selectedFeeToken.decimals);
  const priceText = formattedFeeTokenPrice(
    network,
    networkPrices,
    tokenFeeString,
    selectedFeeToken.address,
    showExactCurrencyGasPrice
  );

  const subtext = priceText;

  const broadcasterFeeERC20Amount: ERC20Amount = {
    token: selectedFeeToken,
    amountString: tokenFee.toString(),
  };

  const tokenDisplayName = getTokenDisplayName(
    selectedFeeToken,
    availableWallets,
    network.name
  );

  return {
    broadcasterFeeText: `${formatNumberToLocale(
      roundStringToNDecimals(tokenFeeString, 10)
    )} ${tokenDisplayName}`,
    broadcasterFeeSubtext: subtext,
    broadcasterFeeERC20Amount,
    broadcasterFeeIsEstimating: false,
  };
};
