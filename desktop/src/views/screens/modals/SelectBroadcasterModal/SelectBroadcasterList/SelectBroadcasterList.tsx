import {
  isDefined,
  SelectedBroadcaster,
} from '@railgun-community/shared-models';
import React from 'react';
import cn from 'classnames';
import { formatUnits } from 'ethers';
import { ListRow } from '@components/ListRow/ListRow';
import { Text } from '@components/Text/Text';
import {
  AppSettingsService,
  renderBroadcasterReliability,
  styleguide,
  useReduxSelector,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './SelectBroadcasterList.module.scss';

type Props = {
  selectedBroadcaster: Optional<SelectedBroadcaster>;
  allBroadcasters: Optional<SelectedBroadcaster[]>;
  decimals: Optional<number>;
  feeTokenName: Optional<string>;
  onSelect: (broadcaster: Optional<SelectedBroadcaster>) => void;
  onSelectRandom: () => void;
};

export const SelectBroadcasterList: React.FC<Props> = ({
  selectedBroadcaster,
  allBroadcasters,
  decimals,
  feeTokenName,
  onSelect,
  onSelectRandom,
}) => {
  const { network } = useReduxSelector('network');
  const { networkPrices } = useReduxSelector('networkPrices');
  const tokenPrices =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];

  const renderBroadcaster = (
    broadcaster: SelectedBroadcaster,
    index: number,
  ) => {
    const selected =
      broadcaster.railgunAddress === selectedBroadcaster?.railgunAddress;

    const { wrappedSymbol } = network.current.baseToken;

    const feeBigInt = BigInt(broadcaster.tokenFee.feePerUnitGas);
    const reliability = broadcaster.tokenFee.reliability;
    const formattedFee = formatUnits(feeBigInt, decimals);
    const parsedFee = parseFloat(formattedFee);
    const parsedDecimals = parsedFee > 1 ? 4 : 8;
    const formattedParsedFee = parsedFee.toFixed(parsedDecimals);
    const reliabilityTag = `${renderBroadcasterReliability(reliability)}`;
    const reliabilityDescription = isDefined(reliability)
      ? reliability
      : 'New broadcaster';

    if (isDefined(tokenPrices)) {
      const currentTokenPrice = tokenPrices[broadcaster.tokenAddress];
      if (isDefined(currentTokenPrice)) {
        const baseTokenPrice =
          tokenPrices[network.current.baseToken.wrappedAddress];
        if (isDefined(baseTokenPrice)) {
          const feeTokenRatio =
            (currentTokenPrice * parseFloat(formattedParsedFee)) /
            baseTokenPrice;
          if (feeTokenRatio < 0.6 || feeTokenRatio > 2.1) {
            return undefined;
          }
        }
      }
    }

    return (
      <ListRow
        key={index}
        title={
          <Text
            className={styles.titleStyle}
          >{`Fee Ratio (${formattedParsedFee} ${feeTokenName} : 1 ${wrappedSymbol.slice(
            1,
          )})`}</Text>
        }
        description={
          <div className={styles.descriptionContainer}>
            <Text
              className={styles.descriptionTextStyle}
            >{`Reliability: ${reliabilityDescription}`}</Text>
          </div>
        }
        descriptionClassName={styles.descriptionStyle}
        selected={selected}
        leftView={() => (
          <div className={styles.iconContainer}>{reliabilityTag}</div>
        )}
        onSelect={() => onSelect(broadcaster)}
      />
    );
  };

  const renderRandomBroadcasterRow = () => {
    return (
      <ListRow
        title={
          <Text className={styles.titleStyle}>{'Random Broadcaster'}</Text>
        }
        description={
          <div className={styles.descriptionContainer}>
            <Text className={styles.descriptionTextStyle}>
              {'Auto-select random Public Broadcaster'}
            </Text>
          </div>
        }
        descriptionClassName={styles.descriptionStyle}
        leftView={() => (
          <div className={styles.iconContainer}>
            {renderIcon(
              IconType.Public,
              22,
              styleguide.colors.lighterLabelSecondary,
            )}
          </div>
        )}
        onSelect={onSelectRandom}
      />
    );
  };

  return (
    <>
      <div className={cn(styles.container, 'hide-scroll')}>
        {!isDefined(allBroadcasters) && (
          <Text className={styles.placeholder}>Loading...</Text>
        )}
        {isDefined(allBroadcasters) && allBroadcasters.length === 0 && (
          <Text className={styles.placeholder}>
            No public broadcasters found for fee token.
          </Text>
        )}
        {isDefined(allBroadcasters) && allBroadcasters.length > 0 && (
          <>
            {renderRandomBroadcasterRow()}
            {allBroadcasters.map(renderBroadcaster)}
          </>
        )}
      </div>
    </>
  );
};
