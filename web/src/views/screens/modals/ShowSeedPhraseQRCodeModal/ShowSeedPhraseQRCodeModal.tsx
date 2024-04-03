import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { CalloutType, styleguide } from '@react-shared';
import { QRCodeCardView } from '@screens/modals/QRCodeCardView/QRCodeCardView';
import styles from './ShowSeedPhraseQRCodeModal.module.scss';

type Props = {
  mnemonic: Optional<string>;
  onDismiss: (readData?: string) => void;
};

export const ShowSeedPhraseQRCodeModal: React.FC<Props> = ({
  mnemonic,
  onDismiss,
}) => {
  if (!isDefined(mnemonic)) {
    return null;
  }

  return (
    <GenericModal onClose={onDismiss} title="QR Code Seed Phrase">
      <div className={styles.wrapper}>
        <QRCodeCardView
          title="Scannable Seed Phrase"
          infoCalloutText="This QR Code contains your seed phrase, which can be used to access your wallet and control your funds. Keep it secret. Keep it safe."
          infoCalloutType={CalloutType.Warning}
          addressOrMnemonic={mnemonic}
          infoCalloutBorderColor={styleguide.colors.danger}
          infoCalloutGradientColors={
            styleguide.colors.gradients.redCallout.colors
          }
        />
      </div>
    </GenericModal>
  );
};
