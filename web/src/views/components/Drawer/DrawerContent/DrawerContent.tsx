import { isDefined, NetworkName } from '@railgun-community/shared-models';
import React from 'react';
import cn from 'classnames';
import { Text } from '@components/Text/Text';
import { WalletAddressHeaderSubtext } from '@components/WalletAddressHeaderSubtext/WalletAddressHeaderSubtext';
import { useReduxSelector } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { getGradientColor } from '@utils/colors';
import styles from './DrawerContent.module.scss';

type Props = {
  show: boolean;
  children: React.ReactNode;
  onRequestClose: () => void;
  headerText?: string;
  variant?: SlideDirection;
  drawerWidth?: number;
  drawerHeight?: number | string;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  iconSize?: number;
  borderGradient?: string;
  isRailgun?: boolean;
  showWalletAddress?: boolean;
};

export enum SlideDirection {
  SLIDE_FROM_LEFT = 'SLIDE_FROM_LEFT',
  SLIDE_FROM_RIGHT = 'SLIDE_FROM_RIGHT',
}

export const DrawerContent = ({
  show,
  headerText,
  children,
  onRequestClose,
  variant,
  drawerHeight,
  drawerWidth,
  contentClassName,
  headerClassName,
  className,
  iconSize,
  isRailgun,
  showWalletAddress = true,
}: Props) => {
  const { network } = useReduxSelector('network');

  const isHorizontal = true;
  const gradientColor =
    isRailgun == null
      ? undefined
      : getGradientColor(network.current.name, isRailgun, isHorizontal);

  const getNavStyles = () => {
    const height = isDefined(drawerHeight) ? drawerHeight : '100%';
    const width = isDefined(drawerWidth) ? drawerWidth : 526;

    if (show && variant === SlideDirection.SLIDE_FROM_LEFT) {
      return {
        className: cn(styles.drawerContentFromLeft, className),
        styles: {
          height,
          width,
          left: -width,
        },
      };
    } else if (show) {
      return {
        className: cn(styles.drawerContent, className),
        styles: {
          height,
          width,
          right: -width,
        },
      };
    } else if (!show && variant === SlideDirection.SLIDE_FROM_LEFT) {
      return {
        className: cn(
          styles.drawerContentFromLeft,
          styles.hideContainer,
          className,
        ),
        styles: {
          height,
          width,
        },
      };
    }

    return {
      className: cn(styles.drawerContent, styles.hideContainer, className),
      styles: {
        height,
        width,
      },
    };
  };

  const cloneChildrenWithClose = () => {
    const childrenWithClose = React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, { onClose: onRequestClose } as any);
      }
      return child;
    });

    return <>{childrenWithClose}</>;
  };

  const navStyles = getNavStyles();

  return (
    <nav className={navStyles.className} style={navStyles.styles}>
      <div className={styles.drawerContainer}>
        <div className={cn(styles.header, headerClassName)}>
          <div onClick={onRequestClose} className={styles.closeIcon}>
            {renderIcon(IconType.Close, iconSize ?? 24)}
          </div>
          <div>
            <Text className={styles.headerText}>{headerText}</Text>
            {showWalletAddress && (
              <WalletAddressHeaderSubtext isRailgun={isRailgun} />
            )}
          </div>
        </div>
        {isDefined(gradientColor) && (
          <div
            className={styles.gradient}
            style={{ background: gradientColor }}
          />
        )}
        <div className={cn(styles.content, contentClassName, 'hide-scroll')}>
          {cloneChildrenWithClose()}
        </div>
      </div>
    </nav>
  );
};
