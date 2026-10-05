import { isDefined } from '@railgun-community/shared-models';
import { useCallback, useEffect, useState } from 'react';
import { AuthenticatedWalletService } from '../../services/wallet/authenticated-wallet-service';
import { UnauthenticatedWalletService } from '../../services/wallet/unauthenticated-wallet-service';
import { logDev } from '../../utils/logging';
import { is7702Network } from '../../utils/networks';
import { useReduxSelector } from '../hooks-redux';

export type EphemeralAccountRef = {
  index: Optional<number>
  address: string;
};

export type EphemeralAccountsState = {
  current: Optional<EphemeralAccountRef>;
  past: EphemeralAccountRef[];
  loading: boolean;
  error: Optional<string>;
  refresh: () => void;
};

export const useEphemeralAccounts = (
  authKey: Optional<string>,
): EphemeralAccountsState => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const railWalletID = wallets.active?.railWalletID;

  const [current, setCurrent] =
    useState<Optional<EphemeralAccountRef>>(undefined);
  const [past, setPast] = useState<EphemeralAccountRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(key => key + 1), []);

  useEffect(() => {
    const networkName = network.current.name;
    const chainId = network.current.chain.id;
    if (
      !isDefined(authKey) ||
      !isDefined(railWalletID) ||
      !is7702Network(networkName)
    ) {
      setCurrent(undefined);
      setPast([]);
      setError(undefined);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(undefined);

    const load = async () => {
      try {
        const authService = new AuthenticatedWalletService(authKey);

        const currentAddress = await authService.getCurrentEphemeralAddress(
          networkName,
          railWalletID,
        );
        if (cancelled) {
          return;
        }

        let currentIndex: Optional<number>;
        let indexedCurrentAddress: Optional<string>;
        let pastRefs: EphemeralAccountRef[] = [];
        try {
          currentIndex =
            await new UnauthenticatedWalletService().getEphemeralKeyIndex(
              railWalletID,
              chainId,
            );
          if (isDefined(currentIndex)) {
            const addresses = await authService.getEphemeralAddressesForRange(
              railWalletID,
              chainId,
              0,
              currentIndex,
            );
            indexedCurrentAddress = addresses[currentIndex];
            if (!isDefined(indexedCurrentAddress)) {
              throw new Error('Current ephemeral address missing from range');
            }
            pastRefs = addresses
              .slice(0, currentIndex)
              .map((address, index) => ({ index, address }))
              .reverse();
          }
        } catch (historyErr) {
          currentIndex = undefined;
          pastRefs = [];
          logDev('Ephemeral account history unavailable', historyErr);
        }
        if (cancelled) {
          return;
        }

        setCurrent({
          index: currentIndex,
          address: indexedCurrentAddress ?? currentAddress,
        });
        setPast(pastRefs);
        setError(undefined);
      } catch (err) {
        if (!cancelled) {
          setCurrent(undefined);
          setPast([]);
          setError(String(err));
          logDev('Failed to load current ephemeral account', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load();

    return () => {
      cancelled = true;
    };
  }, [authKey, network, railWalletID, refreshKey]);

  return { current, past, loading, error, refresh };
};
