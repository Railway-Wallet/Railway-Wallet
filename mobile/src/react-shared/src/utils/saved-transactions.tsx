import {
  isDefined,
  isHistoricalRelayAdaptContractAddress,
  Network,
  NETWORK_CONFIG,
  NetworkName,
  NFTAmountRecipient,
  removeUndefineds,
  TransactionHistoryItemCategory,
  TXIDVersion,
} from "@railgun-community/shared-models";
import { ReactConfig } from "../config";
import { ERC20Amount, ERC20Token } from "../models/token";
import {
  ReceiveERC20Amount,
  ReceiveNFTAmountRecipient,
  SavedTransaction,
  TransactionAction,
  TransactionStatus,
  TransferRecipientERC20Amount,
} from "../models/transaction";
import { AvailableWallet, FrontendWallet } from "../models/wallet";
import { store } from "../redux-store/store";
import { findKnownWalletName, isRailgunAddress } from "./address";
import { getNFTAmountDisplayName } from "./nft";
import {
  compareTokens,
  getTokenDisplayName,
  isWrappedBaseTokenForNetwork,
} from "./tokens";
import {
  formatUnitFromHexStringToLocale,
  isNonSpendableBucket,
  shortenWalletAddress,
} from "./util";
import { getVaultDisplayName } from "./vaults-util";
import { isRailgunWalletAddress } from "./wallets";
import { styleguide } from "../styles/styleguide";

const FEES_TITLE = "Transaction fees";

const RELAY_ADAPT_NAME = "RAILGUN Relay Adapt contract";

const getAmountStringSerialized = (tokenAmountSerialized: ERC20Amount) => {
  return formatUnitFromHexStringToLocale(
    tokenAmountSerialized.amountString,
    tokenAmountSerialized.token.decimals
  );
};

const compareAddresses = (a: string, b: string) => {
  return a.toLowerCase() === b.toLowerCase();
};

const matchWalletAddresses = (address: string, wallet: FrontendWallet) => {
  if (
    !wallet.isViewOnlyWallet &&
    compareAddresses(address, wallet.ethAddress)
  ) {
    return true;
  }
  if (compareAddresses(address, wallet.railAddress)) {
    return true;
  }
  return false;
};

const compareTransactionFromWalletAddress = (
  tx: SavedTransaction,
  wallet: FrontendWallet
): boolean => {
  return matchWalletAddresses(tx.walletAddress, wallet);
};

const findMatchTransactionTokenRecipientAddress = (
  tokenAmount: TransferRecipientERC20Amount | NFTAmountRecipient,
  wallet: FrontendWallet
) => {
  if (
    isDefined(tokenAmount.recipientAddress) &&
    matchWalletAddresses(tokenAmount.recipientAddress, wallet)
  ) {
    return true;
  }
  return false;
};

const compareTransactionToWalletAddress = (
  tx: SavedTransaction,
  tokenAmount: TransferRecipientERC20Amount | NFTAmountRecipient,
  wallet: Optional<FrontendWallet>
): boolean => {
  if (!wallet) {
    return false;
  }
  if (
    isDefined(tx.toWalletAddress) &&
    matchWalletAddresses(tx.toWalletAddress, wallet)
  ) {
    return true;
  }
  if (findMatchTransactionTokenRecipientAddress(tokenAmount, wallet)) {
    return true;
  }
  return false;
};

export const transactionIncludesAnyWalletAddress = (
  tx: SavedTransaction,
  wallet?: FrontendWallet
): boolean => {
  if (!wallet) {
    return false;
  }

  if (compareTransactionFromWalletAddress(tx, wallet)) {
    return true;
  }
  if (
    tx.tokenAmounts.find((tokenAmount) => {
      return compareTransactionToWalletAddress(tx, tokenAmount, wallet);
    })
  ) {
    return true;
  }
  if (
    tx.nftAmountRecipients?.find((nftAmountRecipient) => {
      return compareTransactionToWalletAddress(tx, nftAmountRecipient, wallet);
    })
  ) {
    return true;
  }

  return false;
};

const getWalletNameForAddress = (
  networkName: NetworkName,
  address: string,
  showFullAddress = false
) => {
  const { wallets, savedAddresses } = store.getState();
  const knownWalletName = findKnownWalletName(
    address,
    wallets.available,
    wallets.viewOnly,
    savedAddresses.current
  );
  if (isDefined(knownWalletName)) {
    return knownWalletName;
  }
  if (isHistoricalRelayAdaptContractAddress(networkName, address)) {
    return RELAY_ADAPT_NAME;
  }
  return showFullAddress ? address : shortenWalletAddress(address);
};

const getWalletNameForNFTTransaction = (
  transaction: SavedTransaction,
  nftAmountRecipient: NFTAmountRecipient
) => {
  const walletName = getWalletNameForTransaction(
    transaction,
    nftAmountRecipient.recipientAddress,
    undefined
  );
  return walletName ?? "Unknown Wallet";
};

const getWalletNameForERC20Transaction = (
  transaction: SavedTransaction,
  erc20Amount: Optional<TransferRecipientERC20Amount>
) => {
  const walletName = getWalletNameForTransaction(
    transaction,
    erc20Amount?.recipientAddress,
    erc20Amount?.externalUnresolvedToWalletAddress
  );
  return walletName ?? "Unknown Wallet";
};

const getWalletNameForTransaction = (
  transaction: SavedTransaction,
  recipientAddress: Optional<string>,
  externalUnresolvedToWalletAddress: Optional<string>
): Optional<string> => {
  const { wallets, savedAddresses } = store.getState();
  const address = transaction.toWalletAddress ?? recipientAddress ?? "";

  const knownWalletName = findKnownWalletName(
    address,
    wallets.available,
    wallets.viewOnly,
    savedAddresses.current
  );
  if (isDefined(knownWalletName)) {
    return knownWalletName;
  }
  if (isHistoricalRelayAdaptContractAddress(transaction.network, address)) {
    return RELAY_ADAPT_NAME;
  }

  const unresolvedAddress =
    externalUnresolvedToWalletAddress ??
    transaction.externalUnresolvedToWalletAddress;
  const parentheticalUnresolvedAddress = isDefined(unresolvedAddress)
    ? ` (${unresolvedAddress})`
    : "";

  return `${shortenWalletAddress(address)}${parentheticalUnresolvedAddress}`;
};

export const singleERC20TransactionText = (
  erc20Amount: TransferRecipientERC20Amount | ReceiveERC20Amount,
  transaction: SavedTransaction,
  availableWallets: AvailableWallet[],
  activeWallet?: FrontendWallet,
  isSyncedReceive: boolean = false
): Optional<string> => {
  const { token } = erc20Amount;
  const networkName = transaction.network;
  const tokenName = getTokenDisplayName(
    token,
    availableWallets,
    transaction.network
  );
  const amount = getAmountStringSerialized(erc20Amount);
  switch (transaction.action) {
    case TransactionAction.approve: {
      return `Approve ${tokenName} for ${
        transaction.spenderName ?? "Unknown Spender"
      }.`;
    }
    case TransactionAction.send: {
      if (
        compareTransactionToWalletAddress(
          transaction,
          erc20Amount,
          activeWallet
        )
      ) {
        const senderAddress = transaction.walletAddress;
        const senderWalletName = getWalletNameForAddress(
          networkName,
          senderAddress
        );

        return `You received ${amount} ${tokenName} from ${senderWalletName}.`;
      }

      const walletName = getWalletNameForERC20Transaction(
        transaction,
        erc20Amount
      );

      return `Send ${amount} ${tokenName} ${
        transaction.isPrivate ? "privately " : ""
      }to ${walletName}.`;
    }
    case TransactionAction.receive: {
      return `You received ${amount} ${tokenName}${
        transaction.isPrivate ? " into your private balance" : ""
      }.`;
    }
    case TransactionAction.shield: {
      if (
        compareTransactionToWalletAddress(
          transaction,
          erc20Amount,
          activeWallet
        )
      ) {
        const senderAddress = transaction.walletAddress;
        const senderWalletName = getWalletNameForAddress(
          networkName,
          senderAddress
        );

        return `You received a shield of ${amount} ${tokenName} from ${senderWalletName}.`;
      }

      const walletName = getWalletNameForERC20Transaction(
        transaction,
        erc20Amount
      );
      return `Shield ${amount} ${tokenName} into ${walletName}.`;
    }
    case TransactionAction.unshield: {
      const walletName = getWalletNameForERC20Transaction(
        transaction,
        erc20Amount
      );
      return `Unshield ${amount} ${tokenName} into ${walletName}.`;
    }
    case TransactionAction.mint: {
      return `Mint ${amount} ${tokenName}.`;
    }
    case TransactionAction.cancel: {
      return `Cancel transaction: ${
        transaction.cancelTransactionID ?? "Unknown"
      }.`;
    }
    case TransactionAction.swap: {
      const sellTokenAmount = transaction.swapSellTokenAmount;
      const buyTokenAmount = transaction.swapBuyTokenAmount;
      const swapDestinationAddress = transaction.toWalletAddress;
      if (!sellTokenAmount || !buyTokenAmount) {
        return "Unknown Swap transaction.";
      }
      const sellAmountString = getAmountStringSerialized(sellTokenAmount);
      const buyAmountString = getAmountStringSerialized(buyTokenAmount);
      let swapDestinationText = "";
      if (isDefined(swapDestinationAddress)) {
        const isRailgunDestinationAddress = isRailgunAddress(
          swapDestinationAddress
        );
        const swapDestinationWalletName = getWalletNameForAddress(
          networkName,
          swapDestinationAddress
        );
        swapDestinationText = ` and ${
          isRailgunDestinationAddress ? "shield" : "transfer"
        } to ${swapDestinationWalletName}`;
      }
      return `Swap ${sellAmountString} ${getTokenDisplayName(
        sellTokenAmount.token,
        availableWallets,
        transaction.network
      )} for ${buyAmountString}${transactionSlippageValueConfirmedMarker(
        transaction
      )} ${getTokenDisplayName(
        buyTokenAmount.token,
        availableWallets,
        transaction.network
      )}${swapDestinationText}.`;
    }
    case TransactionAction.farmDeposit: {
      const depositToken = transaction.tokenAmounts[0];
      const vaultERC20 = transaction.tokenAmounts[1];
      const vault = transaction.vault;
      const amountDepositToken = getAmountStringSerialized(depositToken);
      const amountVaultToken = getAmountStringSerialized(vaultERC20);
      const nameDepositToken = getTokenDisplayName(
        depositToken.token,
        availableWallets,
        transaction.network
      );
      const nameVaultToken = getTokenDisplayName(
        vaultERC20.token,
        availableWallets,
        transaction.network
      );
      if (isDefined(vault)) {
        return `You deposited ${amountDepositToken} ${nameDepositToken} into ${
          vault?.name
        } (${getVaultDisplayName(
          vault?.type
        )}) and received ${amountVaultToken} ${nameVaultToken}.`;
      }

      return `You deposited ${amountDepositToken} ${nameDepositToken}`;
    }
    case TransactionAction.farmRedeem: {
      const vaultERC20 = transaction.tokenAmounts[1];
      const redeemERC20 = transaction.tokenAmounts[0];
      const vault = transaction.vault;
      const amountRedeemToken = getAmountStringSerialized(redeemERC20);
      const amountVaultToken = getAmountStringSerialized(vaultERC20);
      const nameRedeemToken = getTokenDisplayName(
        redeemERC20.token,
        availableWallets,
        transaction.network
      );
      const nameVaultToken = getTokenDisplayName(
        vaultERC20.token,
        availableWallets,
        transaction.network
      );
      if (isDefined(vault)) {
        return `You redeemed ${amountRedeemToken} ${nameRedeemToken} from ${
          vault?.name
        } (${getVaultDisplayName(
          vault?.type
        )}) and received ${amountVaultToken} ${nameVaultToken}.`;
      }
      return `You redeemed ${amountRedeemToken} ${nameRedeemToken}.`;
    }
    case TransactionAction.addLiquidity: {
      const pool = transaction.pool;
      const depositTokenA = transaction.tokenAmounts[0];
      const depositTokenB = transaction.tokenAmounts[1];
      const pairToken = transaction.tokenAmounts[2];

      const amountDepositTokenA = getAmountStringSerialized(depositTokenA);
      const amountDepositTokenB = getAmountStringSerialized(depositTokenB);
      const amountPairToken = getAmountStringSerialized(pairToken);
      const nameDepositTokenA = getTokenDisplayName(
        depositTokenA.token,
        availableWallets,
        transaction.network
      );
      const nameDepositTokenB = getTokenDisplayName(
        depositTokenB.token,
        availableWallets,
        transaction.network
      );
      const namePairToken = getTokenDisplayName(
        pairToken.token,
        availableWallets,
        transaction.network
      );

      return `You added liquidity to ${
        pool?.name ?? "N/A pool"
      } of ${amountDepositTokenA} ${nameDepositTokenA} and ${amountDepositTokenB} ${nameDepositTokenB} and received ${amountPairToken}${transactionSlippageValueConfirmedMarker(
        transaction
      )} ${namePairToken}.`;
    }
    case TransactionAction.removeLiquidity: {
      const pool = transaction.pool;
      const pairToken = transaction.tokenAmounts[0];
      const tokenA = transaction.tokenAmounts[1];
      const tokenB = transaction.tokenAmounts[2];

      const amountPairToken = getAmountStringSerialized(pairToken);
      const amountTokenA = getAmountStringSerialized(tokenA);
      const amountTokenB = getAmountStringSerialized(tokenB);
      const namePairToken = getTokenDisplayName(
        pairToken.token,
        availableWallets,
        transaction.network
      );
      const nameTokenA = getTokenDisplayName(
        tokenA.token,
        availableWallets,
        transaction.network
      );
      const nameTokenB = getTokenDisplayName(
        tokenB.token,
        availableWallets,
        transaction.network
      );

      return `You removed liquidity from ${
        pool?.name ?? "N/A pool"
      } of ${amountPairToken} ${namePairToken} for ${amountTokenA}${transactionSlippageValueConfirmedMarker(
        transaction
      )} ${nameTokenA} and ${amountTokenB}${transactionSlippageValueConfirmedMarker(
        transaction
      )} ${nameTokenB}.`;
    }
    case TransactionAction.synced: {
      if (isSyncedReceive) {
        const senderAddress = (erc20Amount as ReceiveERC20Amount).senderAddress;
        const isSyncedShield =
          transaction.syncedCategory ===
          TransactionHistoryItemCategory.ShieldERC20s;

        if (isDefined(senderAddress)) {
          const senderWalletName = getWalletNameForAddress(
            networkName,
            senderAddress,
            true
          );
          return isSyncedShield
            ? `You received a shield of ${amount} ${tokenName} from ${senderWalletName}.`
            : `You received ${amount} ${tokenName} privately from ${senderWalletName}.`;
        } else {
          return isSyncedShield
            ? `You received a shield of ${amount} ${tokenName}.`
            : `You received ${amount} ${tokenName} into your private balance.`;
        }
      }
      const recipientAddress = (erc20Amount as TransferRecipientERC20Amount)
        .recipientAddress;
      if (isDefined(recipientAddress)) {
        const walletName = getWalletNameForAddress(
          networkName,
          recipientAddress
        );
        if (isRailgunWalletAddress(recipientAddress)) {
          return `You sent ${amount} ${tokenName} privately to ${walletName}.`;
        } else {
          return `You unshielded ${amount} ${tokenName} into ${walletName}.`;
        }
      }
      return `You sent ${amount} ${tokenName} privately.`;
    }
  }
};

const transactionSlippageValueConfirmedMarker = (
  transaction: SavedTransaction
) => {
  return transaction.confirmedSwapValue === true ? "" : "*";
};

export const getSavedTransactionTXIDVersion = (tx: SavedTransaction) => {
  return tx.txidVersion ?? TXIDVersion.V2_PoseidonMerkle;
};

export const singleNFTTransactionText = (
  nftAmountRecipient: NFTAmountRecipient | ReceiveNFTAmountRecipient,
  transaction: SavedTransaction,
  activeWallet?: FrontendWallet,
  isSyncedReceive?: boolean
): Optional<string> => {
  const nftAmountDisplayName = getNFTAmountDisplayName(nftAmountRecipient);
  const networkName = transaction.network;

  switch (transaction.action) {
    case TransactionAction.approve: {
      return `Approve NFT collection ${nftAmountRecipient.nftAddress} for ${
        transaction.spenderName ?? "Unknown Spender"
      }.`;
    }
    case TransactionAction.send: {
      if (
        compareTransactionToWalletAddress(
          transaction,
          nftAmountRecipient,
          activeWallet
        )
      ) {
        const senderAddress = transaction.walletAddress;
        const senderWalletName = getWalletNameForAddress(
          networkName,
          senderAddress
        );

        return `You received ${nftAmountDisplayName} from ${senderWalletName}.`;
      }

      const walletName = getWalletNameForNFTTransaction(
        transaction,
        nftAmountRecipient
      );

      return `Send ${nftAmountDisplayName} ${
        transaction.isPrivate ? "privately " : ""
      }to ${walletName}.`;
    }
    case TransactionAction.receive: {
      return `You received ${nftAmountDisplayName} ${
        transaction.isPrivate ? " into your private balance" : ""
      }.`;
    }
    case TransactionAction.shield: {
      const walletName = getWalletNameForNFTTransaction(
        transaction,
        nftAmountRecipient
      );
      return `Shield ${nftAmountDisplayName} into ${walletName}.`;
    }
    case TransactionAction.unshield: {
      const walletName = getWalletNameForNFTTransaction(
        transaction,
        nftAmountRecipient
      );
      return `Unshield ${nftAmountDisplayName} into ${walletName}.`;
    }
    case TransactionAction.synced: {
      if (isSyncedReceive ?? false) {
        const senderAddress = (nftAmountRecipient as ReceiveNFTAmountRecipient)
          .senderAddress;
        if (isDefined(senderAddress)) {
          const showFullAddress = true;
          const senderWalletName = getWalletNameForAddress(
            networkName,
            senderAddress,
            showFullAddress
          );
          return `You received ${nftAmountDisplayName} privately from ${senderWalletName}.`;
        } else {
          return `You received ${nftAmountDisplayName} into your private balance.`;
        }
      }
      const { recipientAddress } = nftAmountRecipient;
      if (recipientAddress) {
        const walletName = getWalletNameForAddress(
          networkName,
          recipientAddress
        );
        if (isRailgunWalletAddress(recipientAddress)) {
          return `You sent ${nftAmountDisplayName} privately to ${walletName}.`;
        } else {
          return `You unshielded ${nftAmountDisplayName} into ${walletName}.`;
        }
      }
      return `You sent ${nftAmountDisplayName} privately.`;
    }

    case TransactionAction.mint:
    case TransactionAction.cancel:
    case TransactionAction.farmDeposit:
    case TransactionAction.farmRedeem:
    case TransactionAction.addLiquidity:
    case TransactionAction.removeLiquidity:
    case TransactionAction.swap:
      return "Unknown NFT transaction.";
  }
};

export const transactionText = (
  transaction: SavedTransaction,
  isRailgunForTokenInfo: boolean,
  network: Network,
  activeWallet: Optional<FrontendWallet>,
  availableWallets: AvailableWallet[],
  filteredToken?: ERC20Token
): string => {
  switch (transaction.action) {
    case TransactionAction.swap:
    case TransactionAction.farmDeposit:
    case TransactionAction.farmRedeem:
    case TransactionAction.addLiquidity:
    case TransactionAction.removeLiquidity:
    case TransactionAction.cancel:
      return singleERC20TransactionText(
        transaction.tokenAmounts[0],
        transaction,
        availableWallets,
        activeWallet
      ) as string;
    case TransactionAction.approve:
    case TransactionAction.send:
    case TransactionAction.receive:
    case TransactionAction.shield:
    case TransactionAction.unshield:
    case TransactionAction.mint:
      return joinedTokenAmountTransactionTexts(
        transaction,
        transaction.tokenAmounts,
        transaction.nftAmountRecipients,
        isRailgunForTokenInfo,
        network,
        activeWallet,
        availableWallets,
        filteredToken
      );
    case TransactionAction.synced: {
      const syncedReceiveERC20Amounts = transaction.syncedReceiveTokenAmounts;
      const syncedReceiveNFTAmountRecipients =
        transaction.syncedReceiveNFTAmountRecipients;
      return `${joinedTokenAmountTransactionTexts(
        transaction,
        transaction.tokenAmounts,
        transaction.nftAmountRecipients,
        isRailgunForTokenInfo,
        network,
        activeWallet,
        availableWallets,
        undefined,
        false
      )} ${
        syncedReceiveERC20Amounts
          ? joinedTokenAmountTransactionTexts(
              transaction,
              syncedReceiveERC20Amounts,
              syncedReceiveNFTAmountRecipients,
              isRailgunForTokenInfo,
              network,
              activeWallet,
              availableWallets,
              undefined,
              true
            )
          : ""
      }`;
    }
  }
};

export const transactionSyncedHistoryDescription = (
  transaction: SavedTransaction
): Optional<string> => {
  if (!isDefined(transaction.syncedHistoryVersion)) {
    return undefined;
  }
  switch (transaction.syncedHistoryVersion) {
    case 0:
      return undefined;
    case 1:
      return `Synced RAILGUN transaction history v1: June - July 2022.\n\n• All transactions are synced from encrypted on-chain data.\n• Transactions submitted between this period have no associated metadata, but gas fees (via broadcaster) are typically the first output of any private transaction.\n• All outgoing transfers will appear as Sent transactions, including gas fees.\n• Unshield transactions (including tokens sent to be swapped) and Shield/Unshield fees are not shown in synced v1 history, but details can be found by viewing a blockchain scanning site.`;
    case 2:
      return `Synced RAILGUN transaction history v2: Aug - Nov 2022.\n\n• All transactions are synced from encrypted on-chain data.\n• Transactions include associated metadata that designates gas fees (via broadcaster) and Change Outputs.\n• Unshield transactions (including tokens sent to be swapped) and Shield/Unshield fees are not shown in synced v2 history, but details can be found by viewing a blockchain scanning site.`;
    case 3:
      return `Synced RAILGUN transaction history v3: Nov 2022 - present.\n\n• All transactions are synced from encrypted on-chain data.\n• Every transaction type (shields, unshields, and transfers) from your private balance are now included in synced history.`;
  }
  return undefined;
};

const joinedTokenAmountTransactionTexts = (
  transaction: SavedTransaction,
  erc20Amounts: (ERC20Amount | ReceiveERC20Amount)[],
  nftAmountRecipients: Optional<NFTAmountRecipient[]>,
  isRailgunForTokenInfo: boolean,
  network: Network,
  activeWallet: Optional<FrontendWallet>,
  availableWallets: AvailableWallet[],
  filteredToken?: ERC20Token,
  isSyncedReceive?: boolean
): string => {
  const erc20TransactionTexts = erc20TokenAmountTransactionTexts(
    transaction,
    erc20Amounts,
    isRailgunForTokenInfo,
    network,
    activeWallet,
    availableWallets,
    filteredToken,
    isSyncedReceive
  );
  const nftTransactionTexts = nftAmountTransactionTexts(
    transaction,
    nftAmountRecipients,
    activeWallet,
    isSyncedReceive
  );
  return [...erc20TransactionTexts, ...nftTransactionTexts].join(" ");
};

const erc20TokenAmountTransactionTexts = (
  transaction: SavedTransaction,
  erc20Amounts: (ERC20Amount | ReceiveERC20Amount)[],
  isRailgunForTokenInfo: boolean,
  network: Network,
  activeWallet: Optional<FrontendWallet>,
  availableWallets: AvailableWallet[],
  filteredToken?: ERC20Token,
  isSyncedReceive?: boolean
): string[] => {
  const filteredTokenTexts = removeUndefineds(
    erc20Amounts
      .filter((erc20Amount) => {
        if (filteredToken) {
          const areTokensEqual = compareTokens(
            filteredToken,
            erc20Amount.token
          );

          const showBaseTokenShield =
            (filteredToken.isBaseToken ?? false) &&
            (transaction.isBaseTokenDepositWithdraw ?? false) &&
            transaction.action === TransactionAction.shield &&
            !isRailgunForTokenInfo;

          const showBaseTokenUnshield =
            isWrappedBaseTokenForNetwork(filteredToken, network) &&
            (transaction.isBaseTokenDepositWithdraw ?? false) &&
            transaction.action === TransactionAction.unshield &&
            isRailgunForTokenInfo;

          return areTokensEqual || showBaseTokenShield || showBaseTokenUnshield;
        }

        return true;
      })
      .map((erc20Amount) =>
        singleERC20TransactionText(
          erc20Amount,
          transaction,
          availableWallets,
          activeWallet,
          isSyncedReceive
        )
      )
  );
  return filteredTokenTexts;
};

const nftAmountTransactionTexts = (
  transaction: SavedTransaction,
  nftAmountRecipients: Optional<NFTAmountRecipient[]>,
  activeWallet: Optional<FrontendWallet>,
  isSyncedReceive?: boolean
): string[] => {
  if (!nftAmountRecipients) {
    return [];
  }
  const filteredTokenTexts = removeUndefineds(
    nftAmountRecipients.map((nftAmountRecipient) =>
      singleNFTTransactionText(
        nftAmountRecipient,
        transaction,
        activeWallet,
        isSyncedReceive
      )
    )
  );
  return filteredTokenTexts;
};

export const railgunFeeTransactionText = (
  transaction: SavedTransaction,
  availableWallets: Optional<AvailableWallet[]>,
  filteredToken?: ERC20Token
): Optional<string> => {
  if (!transaction.railFeeTokenAmounts) {
    return undefined;
  }
  if (transaction.action === TransactionAction.swap) {
    return swapRailgunFeeText(transaction, availableWallets);
  }
  const filteredTokenTexts = removeUndefineds(
    transaction.railFeeTokenAmounts.map((tokenAmount) =>
      railgunFeeText(
        transaction,
        tokenAmount,
        filteredToken,
        availableWallets,
        transaction.action
      )
    )
  );
  if (!filteredTokenTexts.length) {
    return undefined;
  }
  return `${FEES_TITLE}: ${filteredTokenTexts.join(", ")}.`;
};

export const txidVersionTransactionText = (transaction: SavedTransaction) => {
  if (!ReactConfig.ENABLE_V3) {
    return undefined;
  }
  if (
    !isPrivateTx(transaction) &&
    transaction.action !== TransactionAction.unshield &&
    transaction.action !== TransactionAction.shield
  ) {
    return undefined;
  }
  const txidVersion = getSavedTransactionTXIDVersion(transaction);
  return textForTXIDVersion(txidVersion);
};

export const textForTXIDVersion = (txidVersion: TXIDVersion) => {
  switch (txidVersion) {
    case TXIDVersion.V2_PoseidonMerkle:
      return "V2 balances";
    case TXIDVersion.V3_PoseidonMerkle:
      return "V3 balances";
  }
};

const swapRailgunFeeText = (
  transaction: SavedTransaction,
  availableWallets: Optional<AvailableWallet[]>
) => {
  if (
    !transaction.railFeeTokenAmounts ||
    transaction.railFeeTokenAmounts.length !== 2
  ) {
    return undefined;
  }
  const sellFeeText = railgunFeeText(
    transaction,
    transaction.railFeeTokenAmounts[0],
    undefined,
    availableWallets,
    TransactionAction.unshield
  );
  const buyFeeText = railgunFeeText(
    transaction,
    transaction.railFeeTokenAmounts[1],
    undefined,
    availableWallets,
    TransactionAction.shield
  );
  return `${FEES_TITLE}: ${sellFeeText ?? "No sell fee"}, ${
    buyFeeText ?? "No buy fee"
  }.`;
};

const isReceiveOnlyTransaction = (transaction: SavedTransaction) => {
  return (
    transaction.action === TransactionAction.receive ||
    (transaction.action === TransactionAction.synced &&
      transaction.syncedCategory ===
        TransactionHistoryItemCategory.TransferReceiveERC20s)
  );
};

export const getGasFeeText = (
  network: Network,
  transaction: SavedTransaction,
  gasFeeString?: string,
  broadcasterFee?: string
) => {
  if (
    !isDefined(gasFeeString) ||
    isDefined(broadcasterFee) ||
    transaction.sentViaBroadcaster ||
    isReceiveOnlyTransaction(transaction)
  ) {
    return undefined;
  }
  const fee = formatUnitFromHexStringToLocale(
    gasFeeString,
    network.baseToken.decimals
  );

  return `${fee} ${network.baseToken.symbol}`;
};

export const broadcasterFeeTransactionText = (
  transaction: SavedTransaction,
  activeWallet: FrontendWallet,
  availableWallets: AvailableWallet[]
): Optional<string> => {
  if (transaction.walletAddress !== activeWallet.railAddress) {
    return undefined;
  }
  if (!transaction.broadcasterFeeTokenAmount) {
    return undefined;
  }
  return broadcasterFeeText(
    transaction.broadcasterFeeTokenAmount,
    availableWallets,
    transaction.network
  );
};

const railgunFeeText = (
  transaction: SavedTransaction,
  tokenAmount: ERC20Amount,
  filteredToken: Optional<ERC20Token>,
  availableWallets: Optional<AvailableWallet[]>,
  transactionAction: TransactionAction
): Optional<string> => {
  const { token } = tokenAmount;
  if (filteredToken) {
    const feeTokenIsTxToken = compareTokens(filteredToken, token);

    const showBaseTokenShieldFee =
      (token.isBaseToken ?? false) &&
      (transaction.isBaseTokenDepositWithdraw ?? false) &&
      transactionAction === TransactionAction.shield;

    const showBaseTokenUnshieldFee =
      isWrappedBaseTokenForNetwork(
        token,
        NETWORK_CONFIG[transaction.network]
      ) &&
      (transaction.isBaseTokenDepositWithdraw ?? false) &&
      transactionAction === TransactionAction.unshield;

    if (
      !feeTokenIsTxToken &&
      !showBaseTokenShieldFee &&
      !showBaseTokenUnshieldFee
    ) {
      return;
    }
  }

  const amount = getAmountStringSerialized(tokenAmount);
  switch (transactionAction) {
    case TransactionAction.approve:
    case TransactionAction.send:
    case TransactionAction.receive:
    case TransactionAction.mint:
    case TransactionAction.cancel:
    case TransactionAction.swap:
      return undefined;
    case TransactionAction.synced:
    case TransactionAction.shield:
    case TransactionAction.unshield:
    case TransactionAction.addLiquidity:
    case TransactionAction.removeLiquidity:
    case TransactionAction.farmDeposit:
    case TransactionAction.farmRedeem:
      return `${amount} ${getTokenDisplayName(
        token,
        availableWallets,
        transaction.network
      )}`;
  }
};

export const transactionTitle = (transaction: SavedTransaction) => {
  const isSpentPOIPending = transaction.pendingSpentPOI ?? false;
  const isReceivedPOIPending =
    isDefined(transaction.balanceBucket) &&
    isNonSpendableBucket(transaction.balanceBucket);
  if (isReceivedPOIPending || isSpentPOIPending) {
    return "PRIVATE POI PENDING";
  }

  if (transaction.action === TransactionAction.synced) {
    return "SYNCED";
  }

  switch (transaction.status) {
    case TransactionStatus.completed:
      return "COMPLETED";
    case TransactionStatus.failed:
      return "FAILED";
    case TransactionStatus.pending:
      return "PENDING";
    case TransactionStatus.cancelled:
      return "CANCELLED";
    case TransactionStatus.timedOut:
      return "TIMED OUT";
  }
};

export const transactionStatusIconColor = (
  transaction: SavedTransaction
): string => {
  const isPendingSpentPOI = transaction.pendingSpentPOI ?? false;
  if (isPendingSpentPOI) {
    return styleguide.colors.txYellow();
  }

  const isPOIPending =
    isDefined(transaction.balanceBucket) &&
    isNonSpendableBucket(transaction.balanceBucket);
  if (isPOIPending) {
    return styleguide.colors.txYellow();
  }

  switch (transaction.status) {
    case TransactionStatus.completed:
      return styleguide.colors.txGreen();
    case TransactionStatus.pending:
    case TransactionStatus.timedOut:
      return styleguide.colors.txYellow();
    case TransactionStatus.failed:
    case TransactionStatus.cancelled:
      return styleguide.colors.txRed();
  }
};

export const broadcasterFeeText = (
  tokenAmount: ERC20Amount,
  availableWallets: Optional<AvailableWallet[]>,
  networkName: NetworkName
): Optional<string> => {
  const amount = getAmountStringSerialized(tokenAmount);
  return `Gas fee (via broadcaster): ${amount} ${getTokenDisplayName(
    tokenAmount.token,
    availableWallets,
    networkName
  )}.`;
};

export const hasPendingPublicTransaction = (
  visibleTransactions: SavedTransaction[],
  walletAddress: string
): boolean => {
  return isDefined(
    visibleTransactions.find(
      (tx) =>
        tx.status === TransactionStatus.pending &&
        isDefined(tx.publicExecutionWalletAddress) &&
        compareAddresses(tx.publicExecutionWalletAddress, walletAddress)
    )
  );
};

export const isPrivateTx = (tx: SavedTransaction): boolean => {
  return tx.isPrivate ?? tx.sentViaBroadcaster;
};

export const canCancelTransaction = (
  transaction: SavedTransaction
): boolean => {
  const isPending = transaction.status === TransactionStatus.pending;
  return isPending && isDefined(transaction.publicExecutionWalletAddress);
};

export const canMarkAsFailedTransaction = (
  transaction: SavedTransaction
): boolean => {
  const isPending = transaction.status === TransactionStatus.pending;
  if (!isPending || (transaction.cancelling ?? false)) {
    return false;
  }

  const now = Date.now();
  const fifteenMinInSec = 15 * 60;
  const isOver30MinOld = now / 1000 - transaction.timestamp > fifteenMinInSec;
  return isOver30MinOld;
};

export const transactionShouldNavigateToPrivateBalance = (
  tx: SavedTransaction
): boolean => {
  switch (tx.action) {
    case TransactionAction.shield:
    case TransactionAction.synced:
    case TransactionAction.farmDeposit:
    case TransactionAction.farmRedeem:
    case TransactionAction.addLiquidity:
    case TransactionAction.removeLiquidity:
      return true;
    case TransactionAction.swap:
    case TransactionAction.send:
      return isPrivateTx(tx);
    case TransactionAction.receive:
    case TransactionAction.approve:
    case TransactionAction.cancel:
    case TransactionAction.mint:
    case TransactionAction.unshield:
      return false;
  }
};
