import { useEffect } from "react";
import { ModalInteractionManager } from "@services/core/modal-interaction-service";
import { isAndroid } from "@services/util/platform-os-service";

export const useModalInteractionManager = (active: boolean) => {
  useEffect(() => {
    if (active && !isAndroid()) {
      ModalInteractionManager.startInteraction();
    }
  }, [active]);

  const onModalInteractionDismiss = () => {
    ModalInteractionManager.clearAllInteractions();
  };

  return { onModalInteractionDismiss };
};
