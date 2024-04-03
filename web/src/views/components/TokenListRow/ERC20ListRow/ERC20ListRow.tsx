import React, { ReactNode } from 'react';
import { TokenIcon } from '@components/Image/TokenIcon';
import { ListRow } from '@components/ListRow/ListRow';
import { Text } from '@components/Text/Text';
import {
  ERC20Token,
  getTokenDisplayHeader,
  useReduxSelector,
} from '@react-shared';
import styles from './ERC20ListRow.module.scss';

type Props = {
  token: ERC20Token;
  description: React.ReactNode;
  descriptionClassName?: string;
  backgroundColor?: string;
  defaultNoBorder?: boolean;
  selected?: boolean;
  disabled?: boolean;
  rightView?: () => ReactNode;
  onSelect?: () => void;
  error?: boolean;
};

export const ERC20ListRow: React.FC<Props> = ({
  token,
  description,
  descriptionClassName,
  defaultNoBorder,
  selected,
  disabled,
  backgroundColor,
  onSelect,
  error,
  rightView,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const leftView = () => {
    return (
      <div className={styles.iconContainer}>
        <TokenIcon token={token} className={styles.tokenIcon} />
      </div>
    );
  };

  const title = (
    <Text fontWeight={800} fontSize={22} className={styles.titleStyles}>
      {getTokenDisplayHeader(token, wallets.available, network.current.name)}
    </Text>
  );

  return (
    <ListRow
      title={title}
      description={description}
      descriptionClassName={descriptionClassName}
      defaultNoBorder={defaultNoBorder}
      error={error}
      selected={selected}
      disabled={disabled}
      leftView={leftView}
      rightView={rightView}
      onSelect={onSelect}
      backgroundColor={backgroundColor}
    />
  );
};
