import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { RailgunGradient } from '@components/RailgunGradient/RailgunGradient';
import { Text } from '@components/Text/Text';
import {
  showImmediateToast,
  styleguide,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { copyToClipboard } from '@utils/clipboard';
import styles from './NewWalletCard.module.scss';

type Props = {
  walletType: string;
  headerIcon: IconType;
  logos: string[];
  address: string;
  backgroundColor?: string;
  onTapQrCodeButton: (walletType: string) => void;
  className?: string;
  isViewOnlyWallet?: boolean;
};

export const NewWalletCard: React.FC<Props> = ({
  walletType,
  headerIcon,
  logos,
  address,
  backgroundColor,
  onTapQrCodeButton,
  className,
  isViewOnlyWallet = false,
}) => {
  const dispatch = useAppDispatch();

  const gradient = {
    ...styleguide.colors.gradients.railgun,
  };
  if (isDefined(backgroundColor)) {
    gradient.colors = [backgroundColor, backgroundColor, backgroundColor];
  }

  const onTapCopyAddress = async () => {
    await copyToClipboard(address);
    dispatch(
      showImmediateToast({
        message: `${walletType} wallet address copied.`,
        type: ToastType.Copy,
      }),
    );
  };

  return (
    <>
      <div className={cn(styles.newWalletCardContainer, className)}>
        <RailgunGradient
          className={styles.headerBackground}
          gradient={gradient}
        >
          {renderIcon(headerIcon)}
          <Text className={styles.sectionHeaderText}>{walletType}</Text>
        </RailgunGradient>
        <div className={styles.bottomSection}>
          <Text className={styles.fieldName}>Address</Text>
          <div className={styles.addressQrWrapper}>
            <Text className={styles.field}>{address}</Text>
            <div className={styles.buttons}>
              <Button
                endIcon={IconType.Copy}
                onClick={onTapCopyAddress}
                buttonClassName={styles.button}
                iconOnly
              />
              {}
              {}
            </div>
          </div>
          {isViewOnlyWallet && (
            <>
              <Text className={styles.fieldName}>Wallet type</Text>
              <div className={styles.addressQrWrapper}>
                <Text className={styles.field}>View-only</Text>
              </div>
            </>
          )}
          <Text className={styles.fieldName}>Networks</Text>
          <div className={styles.logoWrapper}>
            {logos.map((logo, index) => {
              return (
                <img
                  key={index}
                  src={logo}
                  className={styles.logo}
                  width={120}
                  alt=""
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
