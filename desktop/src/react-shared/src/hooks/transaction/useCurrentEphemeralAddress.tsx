import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { AuthenticatedWalletService } from '../../services/wallet/authenticated-wallet-service';
import { logDev } from '../../utils/logging';
import { is7702Network } from '../../utils/networks';
import { useReduxSelector } from '../hooks-redux';

const syncedEphemeralKeys = new Set<string>();

export const useCurrentEphemeralAddress = (
  authKey: string,
): Optional<string> => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const railWalletID = wallets.active?.railWalletID;

  const [ephemeralAddress, setEphemeralAddress] =
    useState<Optional<string>>(undefined);

  useEffect(() => {
    const networkName = network.current.name;
    if (!isDefined(railWalletID) || !is7702Network(networkName)) {
      setEphemeralAddress(undefined);
      return;
    }

    let cancelled = false;
    const walletService = new AuthenticatedWalletService(authKey);

    const resolve = async () => {
      const syncKey = `${railWalletID}:${networkName}`;
      if (!syncedEphemeralKeys.has(syncKey)) {
        syncedEphemeralKeys.add(syncKey);
        try {
          await walletService.syncEphemeralIndex(
            network.current.chain,
            railWalletID,
          );
        } catch (err) {
          syncedEphemeralKeys.delete(syncKey);
          logDev('Failed to sync ephemeral index', err);
        }
      }
      try {
        const address = await walletService.getCurrentEphemeralAddress(
          networkName,
          railWalletID,
        );
        if (!cancelled) {
          setEphemeralAddress(address);
        }
      } catch (err) {
        if (!cancelled) {
          setEphemeralAddress(undefined);
        }
        logDev('Failed to resolve current ephemeral address', err);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    resolve();

    return () => {
      cancelled = true;
    };
  }, [authKey, network, railWalletID]);

  return ephemeralAddress;
};
