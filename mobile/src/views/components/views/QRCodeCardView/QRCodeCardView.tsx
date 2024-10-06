import React from "react";
import { Text, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { CalloutType } from "@react-shared";
import {
  createRailgunQrCode,
  fadedQrCodePlaceholder,
} from "@services/util/qr-code-service";
import { styles } from "./styles";

type Props = {
  title: string;
  onCopy?: () => void;
  onShare?: () => void;
  infoCalloutText: string;
  addressOrMnemonic: string;
  infoCalloutType: CalloutType;
  infoCalloutBorderColor?: string;
  infoCalloutGradientColors?: string[];
};

export const QRCodeCardView: React.FC<Props> = ({
  title,
  onCopy,
  onShare,
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
        style={styles.infoCallout}
      />
      <View style={styles.cardWrapper}>
        <Text style={styles.titleText}>{title}</Text>
        <View style={styles.qrCodeWrapper}>
          {addressOrMnemonic && createRailgunQrCode(addressOrMnemonic)}
          {!addressOrMnemonic && fadedQrCodePlaceholder(false)}
        </View>
        <Text style={styles.addressText}>{addressOrMnemonic}</Text>
        {addressOrMnemonic && onShare && onCopy && (
          <View style={styles.buttonsWrapper}>
            <ButtonWithTextAndIcon
              title="Share"
              onPress={onShare}
              icon="export-variant"
              additionalStyles={styles.button}
            />
            <ButtonWithTextAndIcon
              title="Copy"
              onPress={onCopy}
              icon="content-copy"
              additionalStyles={styles.button}
            />
          </View>
        )}
      </View>
    </>
  );
};
