import {
  isDefined,
  SelectedBroadcaster,
} from "@railgun-community/shared-models";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FindAllBroadcastersForToken,
  FindBestBroadcaster,
  UpdateBroadcasterAddressFilters,
} from "../../models/callbacks";
import { ERC20Token } from "../../models/token";
import { TransactionType } from "../../models/transaction";
import { compareTokenAddress } from "../../utils";
import { shouldReplaceCurrentBroadcaster } from "../../utils/broadcaster";
import { logDev } from "../../utils/logging";
import { useReduxSelector } from "../hooks-redux";
import { useBroadcasterAddressFilterUpdater } from "./useBroadcasterAddressFilterUpdater";

const REFRESH_SELECTED_BROADCASTER_DELAY = 30000;
const FIND_FIRST_BROADCASTER_DELAY = 2000;

export const useBestBroadcaster = (
  transactionType: TransactionType,
  isPrivate: boolean,
  selectedFeeToken: ERC20Token,
  useRelayAdapt: boolean,
  isMounted: () => boolean,
  findBestBroadcaster: FindBestBroadcaster,
  findAllBroadcastersForToken: FindAllBroadcastersForToken,
  updateBroadcasterAddressFilters: UpdateBroadcasterAddressFilters,
  forceBroadcaster: Optional<SelectedBroadcaster>
) => {
  const { network } = useReduxSelector("network");

  const [selectedBroadcaster, setSelectedBroadcaster] =
    useState<Optional<SelectedBroadcaster>>();
  const [selectedBroadcasterLocked, setSelectedBroadcasterLocked] =
    useState(false);
  const [allBroadcasters, setAllBroadcasters] =
    useState<Optional<SelectedBroadcaster[]>>();

  const { blocklist } = useBroadcasterAddressFilterUpdater(
    updateBroadcasterAddressFilters
  );

  const requiresBroadcaster = useMemo(() => {
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

  const refreshAllBroadcasters = async () => {
    if (!isMounted()) {
      return;
    }

    const allBroadcastersForToken = await findAllBroadcastersForToken(
      network.current.chain,
      selectedFeeToken.address,
      useRelayAdapt
    );

    setAllBroadcasters(allBroadcastersForToken ?? []);
  };

  const refreshSelectedBroadcaster = useCallback(
    async (
      forceNewBroadcaster: Optional<boolean>,
      forceBroadcaster: Optional<SelectedBroadcaster>
    ) => {
      if (selectedBroadcasterLocked) {
        return;
      }
      if (!isMounted()) {
        return;
      }

      if (forceBroadcaster) {
        if (
          selectedBroadcaster?.railgunAddress !==
          forceBroadcaster.railgunAddress
        ) {
          setSelectedBroadcaster(forceBroadcaster);
        }
        return;
      }

      const bestBroadcaster = await findBestBroadcaster(
        network.current.chain,
        selectedFeeToken.address,
        useRelayAdapt
      );
      if (!bestBroadcaster) {
        setSelectedBroadcaster(undefined);
        return;
      }

      const newSelectedBroadcaster: SelectedBroadcaster = {
        railgunAddress: bestBroadcaster.railgunAddress,
        tokenFee: bestBroadcaster.tokenFee,
        tokenAddress: selectedFeeToken.address,
      };

      if (
        (forceNewBroadcaster ?? false) ||
        shouldReplaceCurrentBroadcaster(
          newSelectedBroadcaster,
          selectedBroadcaster
        )
      ) {
        logDev(
          `Selected Broadcaster: ${JSON.stringify(newSelectedBroadcaster)}`
        );
        setSelectedBroadcaster(newSelectedBroadcaster);
      }
    },
    [
      selectedBroadcasterLocked,
      isMounted,
      findBestBroadcaster,
      network,
      selectedFeeToken.address,
      useRelayAdapt,
      selectedBroadcaster,
    ]
  );

  useEffect(() => {
    if (!requiresBroadcaster) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshAllBroadcasters();

    const needsBroadcasterRefresh =
      !selectedBroadcaster ||
      (isDefined(forceBroadcaster) &&
        selectedBroadcaster.railgunAddress !==
          forceBroadcaster.railgunAddress) ||
      !compareTokenAddress(
        selectedBroadcaster.tokenAddress,
        selectedFeeToken.address
      ) ||
      blocklist?.includes(selectedBroadcaster.railgunAddress);

    if (needsBroadcasterRefresh) {
      const forceNewBroadcaster =
        isDefined(selectedBroadcaster) &&
        (blocklist?.includes(selectedBroadcaster?.railgunAddress) ?? false);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refreshSelectedBroadcaster(forceNewBroadcaster, forceBroadcaster);
    }

    const refresh = () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refreshSelectedBroadcaster(false, forceBroadcaster);
    };
    const interval = setInterval(
      refresh,
      selectedBroadcaster
        ? REFRESH_SELECTED_BROADCASTER_DELAY
        : FIND_FIRST_BROADCASTER_DELAY
    );

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    blocklist,
    refreshSelectedBroadcaster,
    requiresBroadcaster,
    selectedFeeToken.address,
    selectedBroadcaster,
    forceBroadcaster,
  ]);

  return {
    lockBroadcaster: setSelectedBroadcasterLocked,
    selectedBroadcasterLocked,
    selectedBroadcaster,
    allBroadcasters,
    requiresBroadcaster,
  };
};
