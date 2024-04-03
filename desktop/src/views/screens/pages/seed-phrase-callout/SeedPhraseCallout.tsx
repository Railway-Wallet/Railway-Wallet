import { isDefined } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { CalloutType, FrontendWallet, styleguide } from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { SeedPhraseCard } from '@screens/modals/ShowSeedPhraseModal/SeedPhraseCard/SeedPhraseCard';
import styles from './SeedPhraseCallout.module.scss';

interface SeedPhraseCalloutProps {
  onNext: () => void;
  wallet: FrontendWallet;
  newWalletAuthKey?: string;
}

export const SeedPhraseCallout: React.FC<SeedPhraseCalloutProps> = ({
  wallet,
  onNext,
  newWalletAuthKey,
}) => {
  const [authKey, setAuthKey] = useState<Optional<string>>(newWalletAuthKey);

  if (!isDefined(authKey)) {
    return <EnterPasswordModal success={setAuthKey} onDismiss={() => {}} />;
  }

  return (
    <GenericModal
      onClose={() => {}}
      showClose={false}
      shouldCloseOnOverlayClick={false}
      title="Save Seed Phrase"
    >
      <div className={cn(styles.wrapper, 'hide-scroll')}>
        <InfoCallout
          type={CalloutType.Warning}
          text="WARNING: Store your seed phrase in order to recover this wallet. If you clear your browser cache or forget your password, your local wallets will be deleted."
          borderColor={styleguide.colors.danger}
          gradientColors={styleguide.colors.gradients.redCallout.colors}
        />
        <div className={styles.spacer} />
        <SeedPhraseCard
          onNext={onNext}
          authKey={authKey}
          wallet={wallet}
          blurSeedPhrase={true}
        />
      </div>
    </GenericModal>
  );
};
