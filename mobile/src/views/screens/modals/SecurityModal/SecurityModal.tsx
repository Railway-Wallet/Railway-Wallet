import React from "react";
import { Modal } from "react-native";
import { SecurityView } from "@components/views/SecurityView.tsx/SecurityView";
import { useModalInteractionManager } from "@hooks/navigation/useModalInteractionManager";

type Props = {
  show: boolean;
};

export const SecurityModal: React.FC<Props> = ({ show }) => {
  const { onModalInteractionDismiss } = useModalInteractionManager(show);
  return (
    <Modal
      animationType="fade"
      presentationStyle="overFullScreen"
      visible={show}
      onRequestClose={() => {}}
      onDismiss={onModalInteractionDismiss}
    >
      <SecurityView />
    </Modal>
  );
};
