import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import {
  getRailgunWalletShareableViewingKey,
  showImmediateToast,
  StoredWallet,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { copyToClipboard } from '@utils/clipboard';
import styles from './ShowShareableViewingKeyModal.module.scss';

interface SeedPhraseProps {
  wallet: StoredWallet;
  onClose: () => void;
}

export const ShowShareableViewingKeyModal = ({
  onClose,
  wallet,
}: SeedPhraseProps) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [shareableViewingKey, setShareableViewingKey] =
    useState<Optional<string>>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isDefined(authKey)) {
      return;
    }
    const getVPK = async () => {
      const shareableViewingKey = await getRailgunWalletShareableViewingKey(
        wallet.railWalletID,
      );
      setShareableViewingKey(shareableViewingKey);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getVPK();
  }, [authKey, wallet]);

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={onClose} />;
  }

  const onCopy = async () => {
    if (!isDefined(shareableViewingKey)) {
      return;
    }
    await copyToClipboard(shareableViewingKey);
    dispatch(
      showImmediateToast({
        message:
          'Shareable Private Key copied. Be careful - it can be used to access your transaction history.',
        type: ToastType.Copy,
      }),
    );
  };

  return (
    <GenericModal onClose={onClose}>
      <Text className={styles.header}>View-Only Private Key</Text>
      <TextButton
        text={shareableViewingKey ?? 'Loading...'}
        action={onCopy}
        containerClassName={styles.vpkContainer}
        textClassName={styles.vpkText}
      />
      <Text className={styles.disclaimer}>
        This private viewing key can be used to access your entire transaction
        history for this 0zk address, across all blockchains. Be careful: once
        shared, access cannot be revoked.
      </Text>
    </GenericModal>
  );
};
