import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { ERC20Token, SavedTransaction } from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { styles } from "./styles";

interface Props {
  pendingApproveTransaction: Optional<SavedTransaction>;
  currentToken: Optional<ERC20Token>;
  approve?: (currentToken: ERC20Token) => void;
  approveText: string;
  customStyles?: Optional<StyleProp<ViewStyle>>;
}

export const ApproveButton = ({
  pendingApproveTransaction,
  currentToken,
  approve,
  approveText,
  customStyles,
}: Props) => {
  return (
    <ButtonWithTextAndIcon
      icon="check-network-outline"
      title={
        pendingApproveTransaction
          ? "Approving token... Please wait."
          : approveText
      }
      onPress={() => {
        if (!approve || !currentToken) {
          return;
        }
        triggerHaptic(HapticSurface.NavigationButton);
        approve(currentToken);
      }}
      additionalStyles={[styles.newTokenButton, customStyles]}
      disabled={isDefined(pendingApproveTransaction)}
    />
  );
};
