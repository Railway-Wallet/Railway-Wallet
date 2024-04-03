import React, { ReactNode } from 'react';
import cn from 'classnames';
import { ListItem } from '@components/ListItem/ListItem';
import styles from './ListRow.module.scss';

type Props = {
  title: React.ReactNode;
  titleTextColor?: string;
  description?: React.ReactNode;
  descriptionTextColor?: string;
  descriptionClassName?: string;
  defaultNoBorder?: boolean;
  backgroundColor?: string;
  selected?: boolean;
  disabled?: boolean;
  rightView?: () => ReactNode;
  leftView?: () => ReactNode;
  onSelect?: () => void;
  hasCursor?: boolean;
  height?: number;
  error?: boolean;
};

export const ListRow: React.FC<Props> = ({
  title,
  description,
  titleTextColor,
  descriptionTextColor,
  descriptionClassName,
  backgroundColor,
  defaultNoBorder = false,
  selected,
  disabled = false,
  onSelect,
  rightView,
  leftView,
  hasCursor = false,
  height = 72,
  error = false,
}) => {
  return (
    <div
      className={cn(styles.rowWrapper, {
        [styles.defaultBorder]: !defaultNoBorder,
        [styles.clickable]: hasCursor || !disabled,
        [styles.disabledWrapper]: disabled,
        [styles.selectedWrapper]: selected,
        [styles.errorWrapper]: error,
      })}
      style={{ height, backgroundColor }}
    >
      <ListItem
        onPress={!disabled ? onSelect : undefined}
        disabled={disabled}
        titleStyle={{ color: titleTextColor }}
        descriptionStyle={{ color: descriptionTextColor }}
        descriptionClassName={descriptionClassName}
        title={title}
        description={description}
        left={leftView}
        right={rightView}
      />
    </div>
  );
};
