import React from 'react';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Text } from '@components/Text/Text';
import { CalloutType } from '@react-shared';
import {
  createRailgunQrCode,
  fadedQrCodePlaceholder,
} from '@services/util/qr-code-service';
import styles from './QRCodeCardView.module.scss';

type Props = {
  title: string;
  infoCalloutText: string;
  addressOrMnemonic: string;
  infoCalloutType: CalloutType;
  infoCalloutBorderColor?: string;
  infoCalloutGradientColors?: string[];
};

export const QRCodeCardView: React.FC<Props> = ({
  title,
  infoCalloutText,
  infoCalloutType,
  addressOrMnemonic,
  infoCalloutBorderColor,
  infoCalloutGradientColors,
}) => {
  return (
    <>
      <InfoCallout
        type={infoCalloutType}
        text={infoCalloutText}
        borderColor={infoCalloutBorderColor}
        gradientColors={infoCalloutGradientColors}
        className={styles.infoCallout}
      />
      <div className={styles.cardWrapper}>
        <Text className={styles.titleText}>{title}</Text>
        <div className={styles.qrCodeWrapper}>
          {addressOrMnemonic && createRailgunQrCode(addressOrMnemonic)}
          {!addressOrMnemonic && fadedQrCodePlaceholder()}
        </div>
        <Text className={styles.addressText}>{addressOrMnemonic}</Text>
      </div>
    </>
  );
};
