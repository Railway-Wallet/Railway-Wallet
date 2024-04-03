import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import cn from 'classnames';
import { Text } from '@components/Text/Text';
import {
  shortenWalletAddress,
  showImmediateToast,
  styleguide,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { copyToClipboard } from '@utils/clipboard';
import styles from './ShortCopyableAddress.module.scss';

export type AddressProps = {
  isRailgun: boolean;
  address?: string;
};

export const ShortCopyableAddress = ({ isRailgun, address }: AddressProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const dispatch = useAppDispatch();

  const copy = async () => {
    if (!isDefined(address)) {
      return;
    }
    await copyToClipboard(address);
    dispatch(
      showImmediateToast({
        message: isRailgun
          ? `RAILGUN address copied. Paste elsewhere to share.`
          : 'Public wallet address copied. Paste elsewhere to share.',
        type: ToastType.Copy,
      }),
    );
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.textContainer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={copy}
      >
        <Text
          className={cn(styles.text, {
            [styles.hovered]: isHovered && address,
          })}
        >
          {isDefined(address) && shortenWalletAddress(address)}
          {!isDefined(address) && 'No wallet loaded'}
        </Text>
        {isDefined(address) && (
          <div className={styles.image}>
            {renderIcon(IconType.Copy, 16, styleguide.colors.labelSecondary)}
          </div>
        )}
      </div>
    </div>
  );
};
