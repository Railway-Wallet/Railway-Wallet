import React from 'react';
import { Button } from '@components/Button/Button';
import {
  GradientStyle,
  RailgunGradient,
} from '@components/RailgunGradient/RailgunGradient';
import { Text } from '@components/Text/Text';
import {
  getNetworkFrontendConfig,
  styleguide,
  useReduxSelector,
  WalletCardSlideItem,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { Constants } from '@utils/constants';
import styles from './WalletCardSlideFooter.module.scss';

type Props = {
  item: WalletCardSlideItem;
  onActionShieldERC20s: () => void;
  onActionUnshieldERC20s: () => void;
};

export const WalletCardSlideFooter: React.FC<Props> = ({
  item,
  onActionShieldERC20s,
  onActionUnshieldERC20s,
}) => {
  const { isRailgun } = item;
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const activeWallet = wallets.active;

  const textIconColor = styleguide.colors.text();

  const networkName = isRailgun ? 'RAILGUN' : network.current.publicName;
  const shieldedStatus = isRailgun ? 'private' : 'public';

  const iconTextView = () => {
    return (
      <div className={styles.footerIconText}>
        <div className={styles.footerIcon}>
          {renderIcon(
            isRailgun ? IconType.Shield : IconType.Public,
            24,
            textIconColor,
          )}
        </div>
        <Text className={styles.footerText} style={{ color: textIconColor }}>
          {networkName} assets are{' '}
          <a
            href={Constants.RAILGUN_FAQ_URL}
            target="_blank"
            rel="noreferrer"
            className={styles.shieldStatusLink}
          >
            {shieldedStatus}
          </a>
          .
        </Text>
      </div>
    );
  };

  const buttonView = () => {
    const action = isRailgun ? onActionUnshieldERC20s : onActionShieldERC20s;
    const icon = isRailgun ? IconType.Public : IconType.Shield;
    const title = isRailgun ? 'Unshield' : 'Shield';

    return (
      <Button
        endIcon={icon}
        onClick={action}
        children={title}
        buttonClassName={styles.button}
        disabled={activeWallet?.isViewOnlyWallet}
      />
    );
  };

  const networkGradient = (): GradientStyle => {
    return {
      ...styleguide.colors.gradients.railgun,
      colors: getNetworkFrontendConfig(network.current.name).gradientColors,
    };
  };

  return (
    <RailgunGradient
      gradient={
        isRailgun ? styleguide.colors.gradients.railgun : networkGradient()
      }
      className={styles.walletCardSlideFooterContainer}
    >
      <div className={styles.footerRow}>
        {iconTextView()}
        {buttonView()}
      </div>
    </RailgunGradient>
  );
};
