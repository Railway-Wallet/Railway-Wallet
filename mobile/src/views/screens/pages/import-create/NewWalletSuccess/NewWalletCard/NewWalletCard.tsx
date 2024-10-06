import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { ButtonIconOnly } from "@components/buttons/ButtonIconOnly/ButtonIconOnly";
import { RailgunGradient } from "@components/gradient/RailgunGradient";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  shortenWalletAddress,
  showImmediateToast,
  styleguide,
  ToastType,
  useAppDispatch,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { Icon, IconSource } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  walletType: string;
  headerIcon: IconSource;
  logos: ImageSourcePropType[];
  address: string;
  backgroundColor?: string;
  onTapQrCodeButton: (walletType: string) => void;
  style?: ViewStyle;
  isViewOnlyWallet?: boolean;
};

export const NewWalletCard: React.FC<Props> = ({
  walletType,
  headerIcon,
  logos,
  address,
  backgroundColor,
  onTapQrCodeButton,
  style,
  isViewOnlyWallet = false,
}) => {
  const dispatch = useAppDispatch();

  const gradient = {
    ...styleguide.colors.gradients.railgun,
  };
  if (isDefined(backgroundColor)) {
    gradient.colors = [backgroundColor, backgroundColor, backgroundColor];
  }

  const onTapCopyAddress = () => {
    triggerHaptic(HapticSurface.ClipboardCopy);
    Clipboard.setString(address);
    dispatch(
      showImmediateToast({
        message: `${walletType} address copied. Paste elsewhere to share.`,
        type: ToastType.Copy,
      })
    );
  };

  return (
    <>
      <View style={[styles.cardWrapper, style]}>
        <RailgunGradient style={styles.headerBackground} gradient={gradient}>
          <Icon source={headerIcon} size={20} color={styleguide.colors.white} />
          <Text style={styles.sectionHeaderText}>{walletType}</Text>
        </RailgunGradient>
        <View style={styles.bottomSection}>
          <Text style={styles.fieldName}>Address</Text>
          <View style={styles.addressQrWrapper}>
            <Text style={styles.field}>{shortenWalletAddress(address)}</Text>
            <View style={styles.buttons}>
              <ButtonIconOnly
                icon="content-copy"
                onTap={onTapCopyAddress}
                size={16}
                color={styleguide.colors.white}
                style={styles.button}
              />
              <ButtonIconOnly
                icon="qrcode"
                onTap={() => onTapQrCodeButton(walletType)}
                size={16}
                color={styleguide.colors.white}
                style={styles.button}
              />
            </View>
          </View>
          {isViewOnlyWallet && (
            <>
              <Text style={styles.fieldName}>Wallet type</Text>
              <View style={styles.addressQrWrapper}>
                <Text style={styles.field}>View-only</Text>
              </View>
            </>
          )}
          <Text style={styles.fieldName}>Networks</Text>
          <View style={styles.logoWrapper}>
            {logos.map((logo, index) => {
              return (
                <Image
                  key={index}
                  source={logo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              );
            })}
          </View>
        </View>
      </View>
    </>
  );
};
