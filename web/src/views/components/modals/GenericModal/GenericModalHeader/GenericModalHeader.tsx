import { isDefined } from '@railgun-community/shared-models';
import React, { ReactElement } from 'react';
import cn from 'classnames';
import { Text } from '@components/Text/Text';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './GenericModalHeader.module.scss';

type Props = {
  title?: string;
  onClose: () => void;
  onBack?: () => void;
  isBackChevron?: boolean;
  accessoryView?: ReactElement;
  showClose?: boolean;
  className?: string;
};

export const GenericModalHeader: React.FC<Props> = ({
  title,
  onClose,
  onBack,
  isBackChevron = false,
  accessoryView,
  showClose = true,
  className,
}) => {
  return (
    <div
      className={cn(styles.headerContainer, className, {
        [styles.headerContainerNoClose]: !showClose,
      })}
    >
      <div className={styles.headerLeftContainer}>
        <div className={styles.closeContainer}>
          {showClose && isBackChevron && (
            <div
              className={styles.dismissIcon}
              onClick={onBack ? () => onBack() : () => onClose()}
            >
              {renderIcon(IconType.ChevronLeft, 24)}
            </div>
          )}
          {showClose && !isBackChevron && (
            <div className={styles.dismissIcon} onClick={() => onClose()}>
              {renderIcon(IconType.Close, 24)}
            </div>
          )}
        </div>
        {isDefined(title) && <Text className={styles.headerText}>{title}</Text>}
      </div>
      {accessoryView}
    </div>
  );
};
