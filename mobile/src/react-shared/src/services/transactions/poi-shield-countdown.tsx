import { isDefined, NetworkName } from "@railgun-community/shared-models";
import { SharedConstants } from "../../config/shared-constants";
import {
  openShieldPOICountdownToast,
  ShieldPOICountdownTx,
} from "../../redux-store/reducers/shield-poi-countdown-toast-reducer";
import { AppDispatch } from "../../redux-store/store";
import { getWaitTimeForShieldPending } from "../../utils/poi";
import { StorageService } from "../storage/storage-service";

export const storeShieldCountdownTx = async (
  tx: ShieldPOICountdownTx
): Promise<void> => {
  const value = await StorageService.getItem(
    SharedConstants.POI_SHIELD_COUNTDOWN_TRANSACTIONS
  );

  const countdownTXs: ShieldPOICountdownTx[] = isDefined(value)
    ? JSON.parse(value)
    : [];

  countdownTXs.push(tx);

  await StorageService.setItem(
    SharedConstants.POI_SHIELD_COUNTDOWN_TRANSACTIONS,
    JSON.stringify(countdownTXs)
  );
};

export const displayShieldCountdownTxsIfNeeded = async (
  network: NetworkName,
  dispatch: AppDispatch
): Promise<void> => {
  const value = await StorageService.getItem(
    SharedConstants.POI_SHIELD_COUNTDOWN_TRANSACTIONS
  );

  let countdownTXs: ShieldPOICountdownTx[] = isDefined(value)
    ? JSON.parse(value)
    : [];

  if (countdownTXs.length === 0) {
    return;
  }

  const now = Date.now() / 1000;
  countdownTXs = countdownTXs.filter(
    (tx) => now - tx.timestamp < (getWaitTimeForShieldPending(network) ?? 0)
  );

  const uniqueTXs: Record<string, ShieldPOICountdownTx> = {};
  countdownTXs.forEach((tx) => {
    uniqueTXs[tx.id] = tx;
  });
  countdownTXs = Object.values(uniqueTXs);

  await StorageService.setItem(
    SharedConstants.POI_SHIELD_COUNTDOWN_TRANSACTIONS,
    JSON.stringify(countdownTXs)
  );

  countdownTXs = countdownTXs.filter((tx) => tx.networkName === network);

  if (countdownTXs.length === 0) {
    return;
  }

  const mostRecentTx = countdownTXs.reduce((prev, current) => {
    return prev.timestamp > current.timestamp ? prev : current;
  }, countdownTXs[0]);

  if (isDefined(mostRecentTx)) {
    dispatch(openShieldPOICountdownToast(mostRecentTx));
  }
};
