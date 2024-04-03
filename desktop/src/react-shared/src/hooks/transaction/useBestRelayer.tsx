import { isDefined, SelectedRelayer } from '@railgun-community/shared-models';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FindAllRelayersForToken,
  FindBestRelayer,
  UpdateRelayerAddressFilters,
} from '../../models/callbacks';
import { ERC20Token } from '../../models/token';
import { TransactionType } from '../../models/transaction';
import { compareTokenAddress } from '../../utils';
import { logDev } from '../../utils/logging';
import { shouldReplaceCurrentRelayer } from '../../utils/relayer';
import { useReduxSelector } from '../hooks-redux';
import { useRelayerAddressFilterUpdater } from './useRelayerAddressFilterUpdater';

const REFRESH_SELECTED_RELAYER_DELAY = 30000;
const FIND_FIRST_RELAYER_DELAY = 2000;

export const useBestRelayer = (
  transactionType: TransactionType,
  isPrivate: boolean,
  selectedFeeToken: ERC20Token,
  useRelayAdapt: boolean,
  isMounted: () => boolean,
  findBestRelayer: FindBestRelayer,
  findAllRelayersForToken: FindAllRelayersForToken,
  updateRelayerAddressFilters: UpdateRelayerAddressFilters,
  forceRelayer: Optional<SelectedRelayer>,
) => {
  const { network } = useReduxSelector('network');

  const [selectedRelayer, setSelectedRelayer] =
    useState<Optional<SelectedRelayer>>();
  const [selectedRelayerLocked, setSelectedRelayerLocked] = useState(false);
  const [allRelayers, setAllRelayers] = useState<Optional<SelectedRelayer[]>>();

  const { blocklist } = useRelayerAddressFilterUpdater(
    updateRelayerAddressFilters,
  );

  const requiresRelayer = useMemo(() => {
    switch (transactionType) {
      case TransactionType.ApproveShield:
      case TransactionType.ApproveSpender:
      case TransactionType.Mint:
      case TransactionType.Cancel:
      case TransactionType.Shield:
        return false;
      case TransactionType.Send:
      case TransactionType.FarmDeposit:
      case TransactionType.FarmRedeem:
      case TransactionType.AddLiquidity:
      case TransactionType.RemoveLiquidity:
      case TransactionType.Swap:
        return isPrivate;
      case TransactionType.Unshield:
        return true;
    }
  }, [transactionType, isPrivate]);

  const refreshAllRelayers = async () => {
    if (!isMounted()) {
      return;
    }

    const allRelayersForToken = await findAllRelayersForToken(
      network.current.chain,
      selectedFeeToken.address,
      useRelayAdapt,
    );

    setAllRelayers(allRelayersForToken ?? []);
  };

  const refreshSelectedRelayer = useCallback(
    async (
      forceNewRelayer: Optional<boolean>,
      forceRelayer: Optional<SelectedRelayer>,
    ) => {
      if (selectedRelayerLocked) {
        return;
      }
      if (!isMounted()) {
        return;
      }

      if (forceRelayer) {
        if (selectedRelayer?.railgunAddress !== forceRelayer.railgunAddress) {
          setSelectedRelayer(forceRelayer);
        }
        return;
      }

      const bestRelayer = await findBestRelayer(
        network.current.chain,
        selectedFeeToken.address,
        useRelayAdapt,
      );
      if (!bestRelayer) {
        setSelectedRelayer(undefined);
        return;
      }

      const newSelectedRelayer: SelectedRelayer = {
        railgunAddress: bestRelayer.railgunAddress,
        tokenFee: bestRelayer.tokenFee,
        tokenAddress: selectedFeeToken.address,
      };

      if (
        (forceNewRelayer ?? false) ||
        shouldReplaceCurrentRelayer(newSelectedRelayer, selectedRelayer)
      ) {
        logDev(`Selected Relayer: ${JSON.stringify(newSelectedRelayer)}`);
        setSelectedRelayer(newSelectedRelayer);
      }
    },
    [
      selectedRelayerLocked,
      isMounted,
      findBestRelayer,
      network,
      selectedFeeToken.address,
      useRelayAdapt,
      selectedRelayer,
    ],
  );

  useEffect(() => {
    if (!requiresRelayer) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshAllRelayers();

    const needsRelayerRefresh =
      !selectedRelayer ||
      (isDefined(forceRelayer) &&
        selectedRelayer.railgunAddress !== forceRelayer.railgunAddress) ||
      !compareTokenAddress(
        selectedRelayer.tokenAddress,
        selectedFeeToken.address,
      ) ||
      blocklist?.includes(selectedRelayer.railgunAddress);

    if (needsRelayerRefresh) {
      const forceNewRelayer =
        isDefined(selectedRelayer) &&
        (blocklist?.includes(selectedRelayer?.railgunAddress) ?? false);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refreshSelectedRelayer(forceNewRelayer, forceRelayer);
    }

    const refresh = () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refreshSelectedRelayer(
        false, forceRelayer,
      );
    };
    const interval = setInterval(
      refresh,
      selectedRelayer
        ? REFRESH_SELECTED_RELAYER_DELAY
        : FIND_FIRST_RELAYER_DELAY,
    );

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    blocklist,
    refreshSelectedRelayer,
    requiresRelayer,
    selectedFeeToken.address,
    selectedRelayer,
    forceRelayer,
  ]);

  return {
    lockRelayer: setSelectedRelayerLocked,
    selectedRelayerLocked,
    selectedRelayer,
    allRelayers,
    requiresRelayer,
  };
};
