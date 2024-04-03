import { isDefined } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import { AddTokensData } from '@models/drawer-types';
import {
  SearchableERC20,
  useAppDispatch,
  useReduxSelector,
  WalletTokenService,
} from '@react-shared';
import { AddCustomTokenView } from '@views/components/AddCustomTokenView/AddCustomTokenView';
import { GenericModal } from '@views/components/modals/GenericModal/GenericModal';

type Props = {
  initialAddTokensData?: AddTokensData;
  initialFullToken: Optional<SearchableERC20>;
  onClose: () => void;
  onSuccessAddedToken?: (tokenAddress: string) => void;
};

export const AddCustomTokenModal: React.FC<Props> = ({
  initialAddTokensData,
  initialFullToken,
  onClose,
  onSuccessAddedToken,
}) => {
  const dispatch = useAppDispatch();
  const { wallets } = useReduxSelector('wallets');
  const { network } = useReduxSelector('network');

  const [isAddingToken, setIsAddingToken] = useState(false);

  const onSuccess = async (token: SearchableERC20) => {
    const walletTokenService = new WalletTokenService(dispatch);
    const activeWallet = wallets.active;
    if (activeWallet) {
      setIsAddingToken(true);
      await walletTokenService.addERC20TokensToWallet(
        activeWallet,
        [token],
        network.current,
      );
      setIsAddingToken(false);
      onSuccessAddedToken?.(token.address);
    }
    onClose();
  };

  return (
    <GenericModal
      shouldCloseOnOverlayClick
      onClose={onClose}
      title="Add token to wallet"
    >
      <AddCustomTokenView
        onSuccess={onSuccess}
        disableEditing={isDefined(initialFullToken)}
        isAddingToken={isAddingToken}
        initialFullToken={initialFullToken}
        initialAddTokensData={initialAddTokensData}
      />
    </GenericModal>
  );
};
