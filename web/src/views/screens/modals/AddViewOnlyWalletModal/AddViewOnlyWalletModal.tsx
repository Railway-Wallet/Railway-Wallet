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
import { IconType } from '@services/util/icon-service';
import { CreateWalletDisclaimerMessage } from '@views/components/CreateWalletDisclaimerMessage/CreateWalletDisclaimerMessage';
import styles from './AddViewOnlyWalletModal.module.scss';

interface ImportProps {
  onClose: (wallet?: FrontendWallet, authKey?: string) => void;
  showBackChevron?: boolean;
  afterPasswordAuthKey?: string;
  onBack?: () => void;
}

export const AddViewOnlyWalletModal = ({
  onClose,
  onBack,
  showBackChevron = true,
  afterPasswordAuthKey,
}: ImportProps) => {
  const [walletName, setWalletName] = useState('');
  const [shareablePrivateKey, setShareablePrivateKey] = useState('');
  const [hasValidWalletName, setHasValidWalletName] = useState(false);
  const [hasValidShareablePrivateKey, setHasValidShareablePrivateKey] =
    useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [authKey, setAuthKey] =
    useState<Optional<string>>(afterPasswordAuthKey);

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={onClose} />;
  }

  const onSubmit = () => {
    setShowProcessModal(true);
  };

  const updateWalletName = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setWalletName(value);
    setHasValidWalletName(validateWalletName(value));
  };

  const updateShareablePrivateKey = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setShareablePrivateKey(value);
    setHasValidShareablePrivateKey(isDefined(value));
  };

  const onSuccess = (wallet: FrontendWallet) => {
    setShowProcessModal(false);
    onClose(wallet, authKey);
  };

  const onFail = () => {
    setShowProcessModal(false);
  };

  return (
    <GenericModal
      onClose={onClose}
      onBack={onBack}
      title="Add View-Only Wallet"
      isBackChevron={showBackChevron}
      accessoryView={
        <Button
          buttonClassName={styles.actionButton}
          onClick={onSubmit}
          disabled={!hasValidWalletName || !hasValidShareablePrivateKey}
        >
          Submit
        </Button>
      }
    >
      <div className={styles.inputContainer}>
        <Input
          value={walletName}
          onChange={updateWalletName}
          placeholder="Wallet name"
          maxLength={SharedConstants.MAX_LENGTH_WALLET_NAME}
          hasError={walletName.length > 0 && !hasValidWalletName}
        />
      </div>
      <Input
        value={shareablePrivateKey}
        onChange={updateShareablePrivateKey}
        placeholder="View-only private key"
        hasError={
          shareablePrivateKey.length > 0 && !hasValidShareablePrivateKey
        }
        endIcon={IconType.Shield}
        iconSize={18}
        iconClassName={styles.inputIcon}
        isTextArea={true}
      />
      <CreateWalletDisclaimerMessage />
      {showProcessModal && (
        <ProcessNewWalletModal
          walletName={walletName.trim()}
          onSuccessClose={wallet => onSuccess(wallet)}
          onFailClose={onFail}
          defaultProcessingText="Adding view-only wallet..."
          successText="Added successfully"
          authKey={authKey}
          isViewOnlyWallet={true}
          shareableViewingKey={shareablePrivateKey}
        />
      )}
    </GenericModal>
  );
};
