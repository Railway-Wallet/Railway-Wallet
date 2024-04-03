import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { StoredWallet } from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { SeedPhraseCard } from './SeedPhraseCard/SeedPhraseCard';
import styles from './ShowSeedPhraseModal.module.scss';

interface SeedPhraseProps {
  onClose: () => void;
  wallet: StoredWallet;
}

export const ShowSeedPhraseModal = ({ onClose, wallet }: SeedPhraseProps) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [mnemonicLength, setMnemonicLength] = useState<number>(0);

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={onClose} />;
  }

  return (
    <GenericModal onClose={onClose}>
      <Text className={styles.header}>{mnemonicLength}-Word Seed Phrase</Text>
      <SeedPhraseCard
        wallet={wallet}
        authKey={authKey}
        setMnemonicWordCount={setMnemonicLength}
      />
      <Text className={styles.disclaimer}>
        This seed phrase is the only way to recover and access your wallet. Keep
        it secret, keep it safe.
      </Text>
    </GenericModal>
  );
};
