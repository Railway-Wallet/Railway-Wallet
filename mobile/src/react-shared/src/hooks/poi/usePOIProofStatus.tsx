import { POIProofEventStatus } from "@railgun-community/shared-models";
import { useEffect, useState } from "react";
import {
  POIProofEventStatusUI,
  POIProofProgress,
} from "../../redux-store/reducers/poi-proof-progress-reducer";
import { useReduxSelector } from "../hooks-redux";

const COMPLETED_TIMER_TIMEOUT = 3000;

export const usePOIProofStatus = () => {
  const { poiProofProgress } = useReduxSelector("poiProofProgress");
  const { network } = useReduxSelector("network");
  const { txidVersion } = useReduxSelector("txidVersion");
  const { wallets } = useReduxSelector("wallets");

  const [poiProofProgressStatus, setPOIProofProgressStatus] =
    useState<Optional<POIProofProgress>>();

  const [shouldShowAllProofsCompleted, setShouldShowAllProofsCompleted] =
    useState(false);

  useEffect(() => {
    const activeWallet = wallets.active;
    if (!activeWallet) {
      return;
    }

    const currentProofProgress =
      poiProofProgress?.forNetwork[network.current.name]?.forTXIDVersion[
        txidVersion.current
      ]?.forWallet[activeWallet.railWalletID];

    const previousProofProgress = poiProofProgressStatus;

    if (
      currentProofProgress?.status === POIProofEventStatus.AllProofsCompleted
    ) {
      if (
        previousProofProgress &&
        previousProofProgress.status ===
          POIProofEventStatusUI.NewTransactionLoading
      ) {
        setPOIProofProgressStatus(previousProofProgress);
        return;
      }

      if (
        previousProofProgress?.status === POIProofEventStatus.AllProofsCompleted
      ) {
        return;
      }

      if (previousProofProgress) {
        setShouldShowAllProofsCompleted(true);
      }

      setPOIProofProgressStatus(undefined);
    } else {
      setPOIProofProgressStatus(currentProofProgress);
    }
  }, [
    wallets.active,
    poiProofProgress?.forNetwork,
    network,
    txidVersion,
    poiProofProgressStatus,
  ]);

  useEffect(() => {
    if (shouldShowAllProofsCompleted) {
      const timeout = setTimeout(() => {
        setShouldShowAllProofsCompleted(false);
      }, COMPLETED_TIMER_TIMEOUT);
      return () => clearTimeout(timeout);
    }
    return;
  }, [shouldShowAllProofsCompleted]);

  return { poiProofProgressStatus, shouldShowAllProofsCompleted };
};
