import { LiquidityV2Pool } from "@railgun-community/cookbook";
import {
  isDefined,
  Network,
  NFTAmountRecipient,
  TXIDVersion,
} from "@railgun-community/shared-models";
import {
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
} from "../../models/token";
import {
  SavedTransaction,
  TransactionAction,
  TransactionStatus,
  TransactionType,
} from "../../models/transaction";
import { Vault } from "../../models/vault";
import { AvailableWallet } from "../../models/wallet";
import { AppDispatch, store } from "../../redux-store/store";
import { convertLiquidityPoolToSerialized } from "../../utils";
import { isWrappedBaseTokenForNetwork } from "../../utils/tokens";
import { PendingTransactionWatcher } from "../transactions/pending-transaction-watcher";
import {
  getBaseTokenForNetwork,
  getWrappedTokenForNetwork,
} from "../wallet/wallet-balance-service";
import { SavedTransactionStore } from "./saved-transaction-store";

export class SavedTransactionService {
  private savedTransactionStore: SavedTransactionStore;

  constructor(dispatch: AppDispatch) {
    this.savedTransactionStore = new SavedTransactionStore(dispatch);
  }

  async saveSendTransaction(
    txidVersion: Optional<TXIDVersion>,
    id: string,
    fromWalletAddress: string,
    publicExecutionWalletAddress: Optional<string>,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    network: Network,
    sentViaBroadcaster: boolean,
    isPrivate: boolean,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>,
    memoText: Optional<string>
  ): Promise<SavedTransaction> {
    if (sentViaBroadcaster && !broadcasterFeeERC20Amount) {
      throw new Error("Expected to save gas fee (via broadcaster).");
    }

    const action = TransactionAction.send;
    const status = TransactionStatus.pending;

    const now = Date.now();
    const tx: SavedTransaction = {
      txidVersion,
      walletAddress: fromWalletAddress,
      tokenAmounts: erc20AmountRecipients,
      publicExecutionWalletAddress,
      nftAmountRecipients,
      network: network.name,
      timestamp: now / 1000,
      id,
      action,
      status,
      sentViaBroadcaster: sentViaBroadcaster,
      isPrivate,
      broadcasterFeeTokenAmount: broadcasterFeeERC20Amount,
      nonce,
      memoText,
      broadcasterRailgunAddress: broadcasterRailgunAddress,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  async saveReceiveTransaction(
    id: string,
    fromWalletAddress: string,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    network: Network,
    nonce: number
  ): Promise<SavedTransaction> {
    const action = TransactionAction.receive;
    const status = TransactionStatus.completed;

    const now = Date.now();
    const tx: SavedTransaction = {
      txidVersion: undefined,
      walletAddress: fromWalletAddress,
      publicExecutionWalletAddress: undefined,
      tokenAmounts: erc20AmountRecipients,
      nftAmountRecipients: nftAmountRecipients,
      network: network.name,
      timestamp: now / 1000,
      id,
      action,
      status,
      sentViaBroadcaster: false,
      isPrivate: false,
      broadcasterFeeTokenAmount: undefined,
      nonce,
      memoText: undefined,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  async saveApproveTransaction(
    id: string,
    walletAddress: string,
    erc20Amounts: ERC20Amount[],
    nftAmountRecipients: NFTAmountRecipient[],
    network: Network,
    spender: string,
    spenderName: string,
    nonce: number
  ): Promise<SavedTransaction> {
    const action = TransactionAction.approve;
    const status = TransactionStatus.pending;

    const now = Date.now();
    const tx: SavedTransaction = {
      txidVersion: undefined,
      walletAddress,
      publicExecutionWalletAddress: walletAddress,
      tokenAmounts: erc20Amounts,
      nftAmountRecipients: nftAmountRecipients,
      network: network.name,
      timestamp: now / 1000,
      id,
      action,
      status,
      sentViaBroadcaster: false,
      isPrivate: false,
      spender,
      spenderName,
      nonce,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  async saveMintTransaction(
    id: string,
    walletAddress: string,
    tokenAmount: ERC20Amount,
    network: Network,
    nonce: number
  ): Promise<SavedTransaction> {
    const action = TransactionAction.mint;
    const status = TransactionStatus.pending;

    const now = Date.now();
    const tx: SavedTransaction = {
      txidVersion: undefined,
      walletAddress,
      publicExecutionWalletAddress: walletAddress,
      tokenAmounts: [tokenAmount],
      nftAmountRecipients: undefined,
      network: network.name,
      timestamp: now / 1000,
      id,
      action,
      status,
      sentViaBroadcaster: false,
      isPrivate: false,
      nonce,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  async saveCancelTransaction(
    id: string,
    walletAddress: string,
    originalTokenAmounts: ERC20Amount[],
    network: Network,
    cancelTransactionID: string,
    nonce: number
  ): Promise<SavedTransaction> {
    const action = TransactionAction.cancel;
    const status = TransactionStatus.pending;

    const now = Date.now();
    const tx: SavedTransaction = {
      txidVersion: undefined,
      walletAddress,
      publicExecutionWalletAddress: walletAddress,
      tokenAmounts: originalTokenAmounts,
      nftAmountRecipients: undefined,
      network: network.name,
      timestamp: now / 1000,
      id,
      action,
      status,
      sentViaBroadcaster: false,
      isPrivate: false,
      cancelTransactionID,
      nonce,
    };

    await this.savedTransactionStore.updateTransactionStatus(
      cancelTransactionID,
      network.name,
      status,
      undefined,
      undefined,
      true
    );

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  async saveSwapTransaction(
    txidVersion: Optional<TXIDVersion>,
    id: string,
    fromWalletAddress: string,
    publicExecutionWalletAddress: Optional<string>,
    sellTokenAmount: ERC20Amount,
    buyTokenAmount: ERC20Amount,
    swapDestinationAddress: Optional<string>,
    network: Network,
    sentViaBroadcaster: boolean,
    isPrivate: boolean,
    needsRelayAdaptSuccessCheck: boolean,
    railgunFeeERC20Amounts: Optional<ERC20Amount[]>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>
  ): Promise<SavedTransaction> {
    const action = TransactionAction.swap;
    const status = TransactionStatus.pending;

    const now = Date.now();
    const tx: SavedTransaction = {
      txidVersion,
      walletAddress: fromWalletAddress,
      publicExecutionWalletAddress,
      tokenAmounts: [sellTokenAmount, buyTokenAmount],
      nftAmountRecipients: undefined,
      swapSellTokenAmount: sellTokenAmount,
      swapBuyTokenAmount: buyTokenAmount,
      toWalletAddress: swapDestinationAddress,
      confirmedSwapValue: false,
      railFeeTokenAmounts: railgunFeeERC20Amounts,
      network: network.name,
      timestamp: now / 1000,
      id,
      action,
      status,
      sentViaBroadcaster: sentViaBroadcaster,
      isPrivate,
      broadcasterFeeTokenAmount: broadcasterFeeERC20Amount,
      nonce,
      needsRelayAdaptSuccessCheck,
      broadcasterRailgunAddress: broadcasterRailgunAddress,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  async saveFarmVaultTransaction(
    txidVersion: TXIDVersion,
    transactionType: TransactionType,
    id: string,
    fromWalletAddress: string,
    publicExecutionWalletAddress: Optional<string>,
    vault: Vault,
    depositTokenAmount: ERC20Amount,
    redeemERC20Amount: ERC20Amount,
    network: Network,
    sentViaBroadcaster: boolean,
    isPrivate: boolean,
    needsRelayAdaptSuccessCheck: boolean,
    railgunFeeERC20Amounts: Optional<ERC20Amount[]>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>
  ): Promise<SavedTransaction> {
    const action =
      transactionType === TransactionType.FarmDeposit
        ? TransactionAction.farmDeposit
        : TransactionAction.farmRedeem;
    const status = TransactionStatus.pending;

    const now = Date.now();
    const tx: SavedTransaction = {
      txidVersion,
      walletAddress: fromWalletAddress,
      publicExecutionWalletAddress,
      tokenAmounts: [depositTokenAmount, redeemERC20Amount],
      nftAmountRecipients: undefined,
      vault,
      railFeeTokenAmounts: railgunFeeERC20Amounts,
      network: network.name,
      timestamp: now / 1000,
      id,
      action,
      status,
      sentViaBroadcaster: sentViaBroadcaster,
      isPrivate,
      broadcasterFeeTokenAmount: broadcasterFeeERC20Amount,
      nonce,
      needsRelayAdaptSuccessCheck,
      broadcasterRailgunAddress: broadcasterRailgunAddress,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  async saveLiquidityTransaction(
    txidVersion: TXIDVersion,
    transactionType: TransactionType,
    id: string,
    fromWalletAddress: string,
    publicExecutionWalletAddress: Optional<string>,
    pool: LiquidityV2Pool,
    depositTokensAmount: ERC20Amount[],
    redeemERC20Amount: ERC20Amount[],
    network: Network,
    sentViaBroadcaster: boolean,
    isPrivate: boolean,
    needsRelayAdaptSuccessCheck: boolean,
    railgunFeeERC20Amounts: Optional<ERC20Amount[]>,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>
  ): Promise<SavedTransaction> {
    const action =
      transactionType === TransactionType.AddLiquidity
        ? TransactionAction.addLiquidity
        : TransactionAction.removeLiquidity;
    const status = TransactionStatus.pending;

    const now = Date.now();
    const tx: SavedTransaction = {
      txidVersion,
      walletAddress: fromWalletAddress,
      publicExecutionWalletAddress,
      tokenAmounts: [...depositTokensAmount, ...redeemERC20Amount],
      nftAmountRecipients: undefined,
      pool: convertLiquidityPoolToSerialized(pool),
      railFeeTokenAmounts: railgunFeeERC20Amounts,
      network: network.name,
      timestamp: now / 1000,
      confirmedSwapValue: false,
      id,
      action,
      status,
      sentViaBroadcaster: sentViaBroadcaster,
      isPrivate,
      broadcasterFeeTokenAmount: broadcasterFeeERC20Amount,
      nonce,
      needsRelayAdaptSuccessCheck,
      broadcasterRailgunAddress: broadcasterRailgunAddress,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  private createShieldDestinationTokenAmounts = (
    outputERC20AmountRecipients: ERC20AmountRecipient[],
    isBaseTokenDeposit: boolean,
    network: Network
  ): ERC20AmountRecipient[] => {
    if (!isBaseTokenDeposit) {
      return outputERC20AmountRecipients;
    }
    if (!outputERC20AmountRecipients.length) {
      return [];
    }
    const anyWallet = store.getState().wallets.available[0];
    return outputERC20AmountRecipients.map((ta) => {
      if (ta.token.isBaseToken ?? false) {
        return {
          token: getWrappedTokenForNetwork(anyWallet, network) as ERC20Token,
          amountString: ta.amountString,
          recipientAddress: ta.recipientAddress,
          externalUnresolvedToWalletAddress:
            ta.externalUnresolvedToWalletAddress,
        };
      }
      return ta;
    });
  };

  private createUnshieldDestinationTokenAmounts = (
    activeWallet: AvailableWallet,
    outputERC20AmountRecipients: ERC20AmountRecipient[],
    isBaseTokenWithdraw: boolean,
    network: Network
  ): ERC20AmountRecipient[] => {
    if (!isBaseTokenWithdraw) {
      return outputERC20AmountRecipients;
    }
    if (!outputERC20AmountRecipients.length) {
      return [];
    }
    return outputERC20AmountRecipients.map((ta) => {
      if (isWrappedBaseTokenForNetwork(ta.token, network)) {
        return {
          token: getBaseTokenForNetwork(activeWallet, network) as ERC20Token,
          amountString: ta.amountString,
          recipientAddress: ta.recipientAddress,
          externalUnresolvedToWalletAddress:
            ta.externalUnresolvedToWalletAddress,
        };
      }
      return ta;
    });
  };

  async saveShieldTransactions(
    txidVersion: TXIDVersion,
    id: string,
    fromWalletAddress: string,
    railgunFeeERC20Amounts: ERC20Amount[],
    outputERC20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    network: Network,
    isBaseTokenDeposit: boolean,
    nonce: number
  ): Promise<SavedTransaction> {
    const now = Date.now();
    const timestamp = now / 1000;

    const destinationOutputTokenAmounts =
      this.createShieldDestinationTokenAmounts(
        outputERC20AmountRecipients,
        isBaseTokenDeposit,
        network
      );

    const tx: SavedTransaction = {
      txidVersion,
      id,
      walletAddress: fromWalletAddress,
      publicExecutionWalletAddress: fromWalletAddress,
      tokenAmounts: destinationOutputTokenAmounts,
      nftAmountRecipients,
      railFeeTokenAmounts: railgunFeeERC20Amounts,
      network: network.name,
      timestamp,
      action: TransactionAction.shield,
      status: TransactionStatus.pending,
      sentViaBroadcaster: false,
      isPrivate: false,
      nonce,
      isBaseTokenDepositWithdraw: isBaseTokenDeposit,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  async saveUnshieldTransactions(
    txidVersion: TXIDVersion,
    id: string,
    activeWallet: AvailableWallet,
    fromWalletAddress: string,
    publicExecutionWalletAddress: Optional<string>,
    railgunFeeERC20Amounts: ERC20Amount[],
    outputERC20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    network: Network,
    sentViaBroadcaster: boolean,
    isBaseTokenWithdraw: boolean,
    broadcasterFeeERC20Amount: Optional<ERC20Amount>,
    broadcasterRailgunAddress: Optional<string>,
    nonce: Optional<number>
  ): Promise<SavedTransaction> {
    const networkName = network.name;
    const now = Date.now();
    const timestamp = now / 1000;

    const destinationOutputERC20AmountRecipients: ERC20AmountRecipient[] =
      this.createUnshieldDestinationTokenAmounts(
        activeWallet,
        outputERC20AmountRecipients,
        isBaseTokenWithdraw,
        network
      );

    const tx: SavedTransaction = {
      txidVersion,
      id,
      walletAddress: fromWalletAddress,
      publicExecutionWalletAddress,
      tokenAmounts: destinationOutputERC20AmountRecipients,
      nftAmountRecipients,
      railFeeTokenAmounts: railgunFeeERC20Amounts,
      network: networkName,
      timestamp,
      action: TransactionAction.unshield,
      status: TransactionStatus.pending,
      sentViaBroadcaster,
      isPrivate: true,
      broadcasterFeeTokenAmount: broadcasterFeeERC20Amount,
      isBaseTokenDepositWithdraw: isBaseTokenWithdraw,
      nonce,
      broadcasterRailgunAddress,
    };

    await this.storeNewTransaction(tx, network);
    return tx;
  }

  private validateTransactionForStorage(transaction: SavedTransaction) {
    if (
      transaction.tokenAmounts.length &&
      !isDefined(transaction.tokenAmounts[0].token)
    ) {
      return false;
    }
    return true;
  }

  async storeNewTransaction(transaction: SavedTransaction, network: Network) {
    const isValid = this.validateTransactionForStorage(transaction);
    if (!isValid) {
      return;
    }
    const networkName = network.name;
    await this.savedTransactionStore.addTransactions(
      [transaction],
      networkName
    );
    if (transaction.status === TransactionStatus.pending) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      PendingTransactionWatcher.watchPendingTransaction(network, transaction);
    }
  }
}
