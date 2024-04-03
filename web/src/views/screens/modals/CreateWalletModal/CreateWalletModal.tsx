import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import {
  FrontendWallet,
  SharedConstants,
  validateWalletName,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { ProcessNewWalletModal } from '@screens/modals/ProcessNewWalletModal/ProcessNewWalletModal';
import { CreateWalletDisclaimerMessage } from '@views/components/CreateWalletDisclaimerMessage/CreateWalletDisclaimerMessage';

type Props = {
  onClose: (wallet?: FrontendWallet, authKey?: string) => void;
  showBackChevron?: boolean;
  afterPasswordAuthKey?: string;
  onBack: () => void;
};

export const CreateWalletModal = ({
  onClose,
  showBackChevron = true,
  afterPasswordAuthKey,
  onBack,
}: Props) => {
  const [walletName, setWalletName] = useState('');
  const [hasValidEntries, setHasValidEntries] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [authKey, setAuthKey] =
    useState<Optional<string>>(afterPasswordAuthKey);

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={onClose} />;
  }

  const onSubmit = () => {
    if (!hasValidEntries) return;

    setShowProcessModal(true);
  };

  const validateEntries = (value: string) => {
    setHasValidEntries(validateWalletName(value));
  };

  const updateWalletName = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setWalletName(value);
    validateEntries(value);
  };

  const onSuccess = (wallet: FrontendWallet) => {
    setShowProcessModal(false);
    onClose(wallet, authKey);
  };

  const onFail = () => {
    setShowProcessModal(false);
  };

  const hasInputError = walletName.length > 0 && !hasValidEntries;

  return (
    <GenericModal
      onClose={onClose}
      title="Create Wallet"
      isBackChevron={showBackChevron}
      onBack={onBack}
      accessoryView={
        <Button onClick={onSubmit} disabled={!hasValidEntries}>
          Submit
        </Button>
      }
    >
      <Input
        value={walletName}
        onChange={updateWalletName}
        placeholder="Wallet name"
        maxLength={SharedConstants.MAX_LENGTH_WALLET_NAME}
        hasError={hasInputError}
      />
      <CreateWalletDisclaimerMessage customTitle="Railway will generate a new wallet address with a random seed phrase." />
      {showProcessModal && (
        <ProcessNewWalletModal
          walletName={walletName.trim()}
          onSuccessClose={wallet => onSuccess(wallet)}
          onFailClose={onFail}
          defaultProcessingText="Generating new wallet..."
          successText="Created successfully"
          authKey={authKey}
          isViewOnlyWallet={false}
        />
      )}
    </GenericModal>
  );
};
