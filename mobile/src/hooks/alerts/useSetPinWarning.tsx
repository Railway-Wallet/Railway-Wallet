import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useEffect, useState } from "react";
import {
  hasBalancesForNetworkOrRailgun,
  StorageService,
  useReduxSelector,
} from "@react-shared";
import { CreatePinModal } from "@screens/modals/CreatePinModal/CreatePinModal";
import { getEncryptedPin } from "@services/security/secure-app-service";
import { showCreatePinAlert } from "@services/util/alert-service";
import { Constants } from "@utils/constants";

export const useSetPinWarning = (requireFunds: boolean = false) => {
  const { network } = useReduxSelector("network");
  const { txidVersion } = useReduxSelector("txidVersion");

  const [showCreatePinModal, setShowCreatePinModal] = useState(false);
  const [dismissSetPinWarning, setDismissSetPinWarning] = useState(false);

  const currentTxidVersion = txidVersion.current;

  useEffect(() => {
    const showAlertIfNecessary = async () => {
      if (dismissSetPinWarning) {
        return;
      }
      const storedPin = await getEncryptedPin();
      if (isDefined(storedPin)) {
        setDismissSetPinWarning(true);
        return;
      }
      const numRemindersStored = await StorageService.getItem(
        Constants.NUM_REMINDERS_SET_PIN
      );
      const numReminders = isDefined(numRemindersStored)
        ? Number(numRemindersStored)
        : 0;
      if (numReminders >= Constants.MAX_REMINDERS_SET_PIN) {
        setDismissSetPinWarning(true);
        return;
      }
      if (
        requireFunds &&
        !hasBalancesForNetworkOrRailgun(
          network.current.name,
          currentTxidVersion,
          [
            RailgunWalletBalanceBucket.Spendable,
            RailgunWalletBalanceBucket.ShieldPending,
          ]
        )
      ) {
        return;
      }
      showCreatePinAlert(
        () => {
          setShowCreatePinModal(true);
        },
        async () => {
          await StorageService.setItem(
            Constants.NUM_REMINDERS_SET_PIN,
            String(numReminders + 1)
          );
        }
      );
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    showAlertIfNecessary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, currentTxidVersion]);

  return {
    dismissSetPinWarning,
    createPinModal: (
      <CreatePinModal
        show={showCreatePinModal}
        dismiss={() => setShowCreatePinModal(false)}
      />
    ),
  };
};
