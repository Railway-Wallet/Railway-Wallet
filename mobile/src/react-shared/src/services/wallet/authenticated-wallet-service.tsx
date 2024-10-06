import {
  FeeTokenDetails,
  isDefined,
  NetworkName,
  NFTAmount,
  NFTAmountRecipient,
  RailgunERC20Recipient,
  TransactionGasDetails,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { ContractTransaction } from "ethers";
import {
  gasEstimateForUnprovenCrossContractCalls,
  generateCrossContractCallsProof,
} from "../../bridge/bridge-cross-contract-calls";
import {
  generateTransferProof,
  generateUnshieldBaseTokenProof,
  generateUnshieldProof,
  generateUnshieldToOriginProof,
} from "../../bridge/bridge-proofs";
import {
  gasEstimateForUnprovenTransfer,
  gasEstimateForUnprovenUnshield,
  gasEstimateForUnprovenUnshieldBaseToken,
  gasEstimateForUnprovenUnshieldToOrigin,
} from "../../bridge/bridge-unshield-transfer";
import { GetGasEstimateProofRequired } from "../../models/callbacks";
import { ERC20Amount, ERC20AmountRecipient } from "../../models/token";

export class AuthenticatedWalletService {
  private dbEncryptionKey?: string;
  private dbEncryptionKeyPromise?: Promise<string>;

  constructor(dbEncryptionKey: string | Promise<string>) {
    if (typeof dbEncryptionKey === "string") {
      this.dbEncryptionKey = dbEncryptionKey;
    } else {
      this.dbEncryptionKeyPromise = dbEncryptionKey;
    }
  }

  private loadDbEncryptionKey = async (): Promise<string> => {
    if (this.dbEncryptionKeyPromise) {
      this.dbEncryptionKey = await this.dbEncryptionKeyPromise;
      this.dbEncryptionKeyPromise = undefined;
      return this.dbEncryptionKey;
    } else if (isDefined(this.dbEncryptionKey)) {
      return this.dbEncryptionKey;
    } else {
      throw new Error("No encryption key");
    }
  };

  getGasEstimatesForUnprovenCrossContractCalls = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    relayAdaptUnshieldERC20Amounts: ERC20Amount[],
    relayAdaptUnshieldNFTAmounts: NFTAmount[],
    relayAdaptShieldERC20Recipients: RailgunERC20Recipient[],
    relayAdaptShieldNFTRecipients: NFTAmountRecipient[],
    crossContractCalls: ContractTransaction[],
    originalGasDetails: TransactionGasDetails,
    feeTokenDetails: Optional<FeeTokenDetails>,
    sendWithPublicWallet: boolean,
    minGasLimit: bigint
  ): Promise<bigint> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return gasEstimateForUnprovenCrossContractCalls(
      txidVersion,
      networkName,
      railWalletID,
      dbEncryptionKey,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      crossContractCalls,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet,
      minGasLimit
    );
  };

  getGasEstimatesForUnprovenTransfer: GetGasEstimateProofRequired = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    memoText: Optional<string>,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    originalGasDetails: TransactionGasDetails,
    feeTokenDetails: Optional<FeeTokenDetails>,
    sendWithPublicWallet: boolean
  ): Promise<bigint> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return gasEstimateForUnprovenTransfer(
      txidVersion,
      networkName,
      railWalletID,
      dbEncryptionKey,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet
    );
  };

  getGasEstimatesForUnprovenUnshield: GetGasEstimateProofRequired = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    memoText: Optional<string>,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    originalGasDetails: TransactionGasDetails,
    feeTokenDetails: Optional<FeeTokenDetails>,
    sendWithPublicWallet: boolean
  ): Promise<bigint> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return gasEstimateForUnprovenUnshield(
      txidVersion,
      networkName,
      railWalletID,
      dbEncryptionKey,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      originalGasDetails,
      feeTokenDetails,
      sendWithPublicWallet
    );
  };

  getGasEstimatesForUnprovenUnshieldToOrigin = async (
    originalShieldTxid: string,
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[]
  ): Promise<bigint> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return gasEstimateForUnprovenUnshieldToOrigin(
      originalShieldTxid,
      txidVersion,
      networkName,
      railWalletID,
      dbEncryptionKey,
      erc20AmountRecipients,
      nftAmountRecipients
    );
  };

  getGasEstimatesForUnprovenUnshieldBaseToken: GetGasEstimateProofRequired =
    async (
      txidVersion: TXIDVersion,
      networkName: NetworkName,
      railWalletID: string,
      memoText: Optional<string>,
      erc20AmountRecipients: ERC20AmountRecipient[],
      nftAmountRecipients: NFTAmountRecipient[],
      originalGasDetails: TransactionGasDetails,
      feeTokenDetails: Optional<FeeTokenDetails>,
      sendWithPublicWallet: boolean
    ): Promise<bigint> => {
      if (erc20AmountRecipients.length !== 1) {
        throw new Error(
          "You must select one token for this unshield transaction."
        );
      }

      const dbEncryptionKey = await this.loadDbEncryptionKey();
      return gasEstimateForUnprovenUnshieldBaseToken(
        txidVersion,
        networkName,
        railWalletID,
        dbEncryptionKey,
        memoText,
        erc20AmountRecipients,
        nftAmountRecipients,
        originalGasDetails,
        feeTokenDetails,
        sendWithPublicWallet
      );
    };

  generateCrossContractCallsProof = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    relayAdaptUnshieldERC20Amounts: ERC20Amount[],
    relayAdaptUnshieldNFTAmounts: NFTAmount[],
    relayAdaptShieldERC20Recipients: RailgunERC20Recipient[],
    relayAdaptShieldNFTRecipients: NFTAmountRecipient[],
    crossContractCalls: ContractTransaction[],
    broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
    sendWithPublicWallet: boolean,
    overallBatchMinGasPrice: Optional<bigint>,
    minGasLimit: bigint
  ): Promise<void> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return generateCrossContractCallsProof(
      txidVersion,
      networkName,
      railWalletID,
      dbEncryptionKey,
      relayAdaptUnshieldERC20Amounts,
      relayAdaptUnshieldNFTAmounts,
      relayAdaptShieldERC20Recipients,
      relayAdaptShieldNFTRecipients,
      crossContractCalls,
      broadcasterFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      minGasLimit
    );
  };

  generateTransferProof = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    memoText: Optional<string>,
    showSenderAddressToRecipient: boolean,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
    sendWithPublicWallet: boolean,
    overallBatchMinGasPrice: Optional<bigint>
  ): Promise<void> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return generateTransferProof(
      txidVersion,
      networkName,
      railWalletID,
      dbEncryptionKey,
      showSenderAddressToRecipient,
      memoText,
      erc20AmountRecipients,
      nftAmountRecipients,
      broadcasterFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice
    );
  };

  generateUnshieldProof = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[],
    broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
    sendWithPublicWallet: boolean,
    overallBatchMinGasPrice: Optional<bigint>
  ): Promise<void> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return generateUnshieldProof(
      txidVersion,
      networkName,
      railWalletID,
      dbEncryptionKey,
      erc20AmountRecipients,
      nftAmountRecipients,
      broadcasterFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice
    );
  };

  generateUnshieldBaseTokenProof = async (
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    publicWalletAddress: string,
    railWalletID: string,
    wrappedTokenAmount: ERC20Amount,
    broadcasterFeeERC20AmountRecipient: Optional<ERC20AmountRecipient>,
    sendWithPublicWallet: boolean,
    overallBatchMinGasPrice: Optional<bigint>
  ): Promise<void> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return generateUnshieldBaseTokenProof(
      txidVersion,
      networkName,
      publicWalletAddress,
      railWalletID,
      dbEncryptionKey,
      wrappedTokenAmount,
      [],
      broadcasterFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice
    );
  };

  generateUnshieldToOriginProof = async (
    originalShieldTxid: string,
    txidVersion: TXIDVersion,
    networkName: NetworkName,
    railWalletID: string,
    erc20AmountRecipients: ERC20AmountRecipient[],
    nftAmountRecipients: NFTAmountRecipient[]
  ): Promise<void> => {
    const dbEncryptionKey = await this.loadDbEncryptionKey();
    return generateUnshieldToOriginProof(
      originalShieldTxid,
      txidVersion,
      networkName,
      railWalletID,
      dbEncryptionKey,
      erc20AmountRecipients,
      nftAmountRecipients
    );
  };
}
