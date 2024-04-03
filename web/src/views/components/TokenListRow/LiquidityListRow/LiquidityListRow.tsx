import { RailgunWalletBalanceBucket } from '@railgun-community/shared-models';
import React from 'react';
import { TokenIcon } from '@components/Image/TokenIcon';
import { ListRow } from '@components/ListRow/ListRow';
import { Text } from '@components/Text/Text';
import {
  ERC20Token,
  getTokenDisplayNameShort,
  styleguide,
  useGetTokenBalanceDescription,
  useReduxSelector,
} from '@react-shared';
import styles from './LiquidityListRow.module.scss';

type Props = {
  tokens: ERC20Token[];
  defaultNoBorder?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

export const LiquidityListRow: React.FC<Props> = ({
  tokens,
  defaultNoBorder,
  selected,
  disabled,
  onSelect,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { getTokenBalanceDescription } =
    useGetTokenBalanceDescription(balanceBucketFilter);
  const [tokenA, tokenB] = tokens;

  const title = (
    <Text className={styles.titleStyles}>
      {`${getTokenDisplayNameShort(
        tokenA,
        wallets.available,
        network.current.name,
      )}-${getTokenDisplayNameShort(
        tokenB,
        wallets.available,
        network.current.name,
      )}`}
    </Text>
  );

  const description = `${getTokenBalanceDescription(
    tokenA,
  )} • ${getTokenBalanceDescription(tokenB)}`;

  const leftView = () => {
    return (
      <div className={styles.leftViewContainer}>
        <div className={styles.iconContainerLeft}>
          <TokenIcon token={tokenA} className={styles.tokenIcon} />
        </div>
        <div className={styles.iconContainerRight}>
          <TokenIcon token={tokenB} className={styles.tokenIcon} />
        </div>
      </div>
    );
  };

  return (
    <ListRow
      title={title}
      description={description}
      descriptionClassName={styles.descriptionStyle}
      defaultNoBorder={defaultNoBorder}
      selected={selected}
      disabled={disabled}
      leftView={leftView}
      backgroundColor={styleguide.colors.gray6()}
      onSelect={onSelect}
    />
  );
};
