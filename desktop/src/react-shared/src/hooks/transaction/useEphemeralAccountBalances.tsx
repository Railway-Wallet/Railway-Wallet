import { isDefined } from '@railgun-community/shared-models';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getWalletBaseTokenBalance } from '../../services/token/base-token';
import { getERC20Balance } from '../../services/token/erc20';
import { logDev } from '../../utils/logging';
import { useAppDispatch, useReduxSelector } from '../hooks-redux';
import { EphemeralTradedToken } from './useEphemeralAccountAssociations';

export type EphemeralScanTarget = {
  address: string;
  tokens: EphemeralTradedToken[]
};

export type EphemeralTokenBalance = {
  token: EphemeralTradedToken;
  balance: bigint;
};

export type EphemeralAccountBalance = {
  native: Optional<bigint>;
  erc20: EphemeralTokenBalance[]
};

export type EphemeralAccountBalances = {
  balances: Record<string, EphemeralAccountBalance>
  loadingAddresses: string[];
  scanAccount: (target: EphemeralScanTarget) => void;
};

export const useEphemeralAccountBalances = (): EphemeralAccountBalances => {
  const { network } = useReduxSelector('network');
  const dispatch = useAppDispatch();
  const networkName = network.current.name;

  const [balances, setBalances] = useState<
    Record<string, EphemeralAccountBalance>
  >({});
  const [loadingAddresses, setLoadingAddresses] = useState<string[]>([]);

  const networkRef = useRef(network.current);
  networkRef.current = network.current;

  useEffect(() => {
    setBalances({});
    setLoadingAddresses([]);
  }, [networkName]);

  const scanAccount = useCallback(
    (target: EphemeralScanTarget) => {
      const currentNetwork = networkRef.current;
      setLoadingAddresses(prev =>
        prev.includes(target.address) ? prev : [...prev, target.address],
      );
      const run = async () => {
        let native: Optional<bigint>;
        try {
          native = await getWalletBaseTokenBalance(
            currentNetwork.name,
            target.address,
          );
        } catch (err) {
          logDev('Failed to load ephemeral native balance', err);
        }
        const erc20: EphemeralTokenBalance[] = [];
        for (const token of target.tokens) {
          if (token.isBaseToken) {
            continue;
          }
          try {
            const balance = await getERC20Balance(
              dispatch,
              currentNetwork,
              target.address,
              {
                isAddressOnly: true,
                address: token.address,
                decimals: token.decimals,
                isBaseToken: false,
              },
            );
            if (isDefined(balance) && balance > 0n) {
              erc20.push({ token, balance });
            }
          } catch (err) {
            logDev('Failed to load ephemeral ERC20 balance', err);
          }
        }
        setBalances(prev => ({ ...prev, [target.address]: { native, erc20 } }));
        setLoadingAddresses(prev => prev.filter(a => a !== target.address));
      };
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      run();
    },
    [dispatch],
  );

  return { balances, loadingAddresses, scanAccount };
};
