import {
  isDefined,
  TransactionHistoryItem,
} from '@railgun-community/shared-models';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getWalletTransactionHistory } from '../../bridge/bridge-wallets';
import { ERC20Token } from '../../models/token';
import { SavedTransaction } from '../../models/transaction';
import { logDevError } from '../../utils/logging';
import { useReduxSelector } from '../hooks-redux';

export type EphemeralTradedToken = {
  address: string;
  symbol: string;
  decimals: number;
  isBaseToken: boolean;
};

export type EphemeralAccountAssociation = {
  tokens: EphemeralTradedToken[];
  transactions: SavedTransaction[]
};

export type EphemeralAccountAssociations = Record<
  string,
  EphemeralAccountAssociation
>;

export type EphemeralAccountAssociationsResult = {
  associations: EphemeralAccountAssociations;
  loading: boolean;
  refresh: () => void;
};

const shortAddress = (address: string): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

const pushToken = (
  tokens: EphemeralTradedToken[],
  address: string,
  symbol: string,
  decimals: number,
  isBaseToken: boolean,
) => {
  const lower = address.toLowerCase();
  if (!tokens.some(token => token.address === lower)) {
    tokens.push({ address: lower, symbol, decimals, isBaseToken });
  }
};

const pushRichToken = (tokens: EphemeralTradedToken[], token: ERC20Token) => {
  pushToken(
    tokens,
    token.address,
    'symbol' in token && isDefined(token.symbol)
      ? token.symbol
      : shortAddress(token.address),
    token.decimals,
    token.isBaseToken ?? false,
  );
};

const savedTransactionTokens = (
  tx: SavedTransaction,
): EphemeralTradedToken[] => {
  const tokens: EphemeralTradedToken[] = [];
  if (isDefined(tx.swapSellTokenAmount)) {
    pushRichToken(tokens, tx.swapSellTokenAmount.token);
  }
  if (isDefined(tx.swapBuyTokenAmount)) {
    pushRichToken(tokens, tx.swapBuyTokenAmount.token);
  }
  for (const amount of tx.tokenAmounts) {
    pushRichToken(tokens, amount.token);
  }
  return tokens;
};

export const useEphemeralAccountAssociations = (
  addresses: string[],
): EphemeralAccountAssociationsResult => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { savedTransactions } = useReduxSelector('savedTransactions');

  const networkName = network.current.name;
  const chain = network.current.chain;
  const railWalletID = wallets.active?.railWalletID;
  const chainKey = `${chain.type}:${chain.id}`;

  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!isDefined(railWalletID)) {
      setHistory([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getWalletTransactionHistory(chain, railWalletID, undefined)
      .then(items => {
        if (!cancelled) {
          setHistory(items);
        }
      })
      .catch(err => {
        if (!cancelled) {
          logDevError('Failed to load ephemeral association history', err);
          setHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainKey, railWalletID, reloadCount]);

  const refresh = useCallback(() => setReloadCount(count => count + 1), []);

  const addressesKey = addresses.join(',').toLowerCase();
  const networkTransactions = savedTransactions.forNetwork[networkName];

  const associations = useMemo(() => {
    const addressList = addressesKey.length > 0 ? addressesKey.split(',') : [];
    const result: EphemeralAccountAssociations = {};
    for (const address of addressList) {
      result[address] = { tokens: [], transactions: [] };
    }
    if (addressList.length === 0) {
      return result;
    }
    const addressSet = new Set(addressList);

    const link = (
      address: string,
      savedTx: Optional<SavedTransaction>,
      tokens: EphemeralTradedToken[],
    ) => {
      const association = result[address];
      if (
        isDefined(savedTx) &&
        !association.transactions.some(tx => tx.id === savedTx.id)
      ) {
        association.transactions.push(savedTx);
      }
      for (const token of tokens) {
        if (!association.tokens.some(t => t.address === token.address)) {
          association.tokens.push(token);
        }
      }
    };

    const savedByTxid = new Map<string, SavedTransaction>();
    for (const tx of networkTransactions ?? []) {
      savedByTxid.set(tx.id.toLowerCase(), tx);
    }

    for (const item of history) {
      const targeted = new Set<string>();
      for (const unshield of item.unshieldERC20Amounts) {
        const recipient = unshield.recipientAddress?.toLowerCase();
        if (isDefined(recipient) && addressSet.has(recipient)) {
          targeted.add(recipient);
        }
      }
      for (const transfer of item.transferERC20Amounts) {
        const recipient = transfer.recipientAddress?.toLowerCase();
        if (isDefined(recipient) && addressSet.has(recipient)) {
          targeted.add(recipient);
        }
      }
      if (targeted.size === 0) {
        continue;
      }

      const savedTx = savedByTxid.get(item.txid.toLowerCase());

      const candidateTokens = isDefined(savedTx)
        ? savedTransactionTokens(savedTx)
        : [];
      for (const unshield of item.unshieldERC20Amounts) {
        pushToken(
          candidateTokens,
          unshield.tokenAddress,
          shortAddress(unshield.tokenAddress),
          18,
          false,
        );
      }

      for (const address of targeted) {
        link(address, savedTx, candidateTokens);
      }
    }

    for (const tx of networkTransactions ?? []) {
      const executor = tx.publicExecutionWalletAddress?.toLowerCase();
      if (isDefined(executor) && addressSet.has(executor)) {
        link(executor, tx, savedTransactionTokens(tx));
      }
    }
    for (const association of Object.values(result)) {
      association.transactions.sort((a, b) => b.timestamp - a.timestamp);
    }
    return result;
  }, [addressesKey, history, networkTransactions]);

  return { associations, loading, refresh };
};
