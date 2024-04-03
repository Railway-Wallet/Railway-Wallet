import { isDefined } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import { ListItem } from '@components/ListItem/ListItem';
import { Text } from '@components/Text/Text';
import { styleguide } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './SelectableListItem.module.scss';

type Props = {
  title: string;
  titleIconSource?: React.ReactElement;
  description?: string;
  rightText?: string;
  rightSubtext?: string;
  onTap: () => void;
  disabled?: boolean;
  hideRightIcon?: boolean;
  customRightView?: React.ReactNode;
  evenLeftAndRight?: boolean;
};

export const SelectableListItem: React.FC<Props> = ({
  title,
  titleIconSource,
  description,
  rightText,
  rightSubtext,
  onTap,
  disabled = false,
  hideRightIcon = false,
  customRightView,
  evenLeftAndRight,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const titleView = (
    <div className={styles.headerTextWrapper}>
      <Text className={styles.titleStyle}>{title}</Text>
      {titleIconSource && (
        <div className={styles.headerIcon}>{titleIconSource}</div>
      )}
    </div>
  );

  return (
    <div
      className={cn(styles.rowWrapper, {
        [styles.hovered]: !disabled && isHovered,
      })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ListItem
        onPress={disabled ? undefined : onTap}
        className={styles.listItem}
        title={titleView}
        description={description}
        descriptionClassName={styles.leftDescriptionStyle}
        evenLeftAndRight={evenLeftAndRight}
        right={() => {
          if (isDefined(customRightView)) {
            return customRightView;
          }

          return (
            <div className={styles.rightWrapper}>
              {isDefined(rightText) && (
                <div className={styles.rightTextWrapper}>
                  <Text className={styles.rightText}>{rightText}</Text>
                  {isDefined(rightSubtext) && (
                    <Text className={styles.rightSubtext}>{rightSubtext}</Text>
                  )}
                </div>
              )}
              {!disabled &&
                !hideRightIcon &&
                renderIcon(
                  IconType.ChevronRight,
                  24,
                  styleguide.colors.labelSecondary,
                )}
            </div>
          );
        }}
      />
    </div>
  );
};
