import { isDefined } from "@railgun-community/shared-models";
import React, { useState } from "react";
import { Modal } from "react-native";
import {
  SearchableERC20,
  useAppDispatch,
  useReduxSelector,
  WalletTokenService,
} from "@react-shared";
import { AddCustomTokenView } from "../../../components/views/AddCustomTokenView/AddCustomTokenView";

type Props = {
  show: boolean;
  initialAddTokenAddress?: string;
  initialFullToken: Optional<SearchableERC20>;
  onClose: () => void;
  onSuccessAddedToken?: (tokenAddress: string) => void;
};

export const AddCustomTokenModal: React.FC<Props> = ({
  show,
  initialAddTokenAddress,
  initialFullToken,
  onClose,
  onSuccessAddedToken,
}) => {
  const dispatch = useAppDispatch();
  const { wallets } = useReduxSelector("wallets");
  const { network } = useReduxSelector("network");

  const [isAddingToken, setIsAddingToken] = useState(false);

  const onSuccess = async (token: SearchableERC20) => {
    const walletTokenService = new WalletTokenService(dispatch);
    const activeWallet = wallets.active;
    if (activeWallet) {
      setIsAddingToken(true);
      await walletTokenService.addERC20TokensToWallet(
        activeWallet,
        [token],
        network.current
      );
      setIsAddingToken(false);
      onSuccessAddedToken?.(token.address);
    }
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="formSheet"
      visible={show}
      onRequestClose={onClose}
    >
      <AddCustomTokenView
        onSuccess={onSuccess}
        disableEditing={isDefined(initialFullToken)}
        onClose={onClose}
        isAddingToken={isAddingToken}
        initialAddTokenAddress={initialAddTokenAddress}
        initialFullToken={initialFullToken}
      />
    </Modal>
  );
};
