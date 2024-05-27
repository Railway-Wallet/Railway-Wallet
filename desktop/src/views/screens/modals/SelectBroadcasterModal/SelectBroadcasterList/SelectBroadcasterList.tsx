import { isDefined, SelectedBroadcaster } from '@railgun-community/shared-models';
import React from 'react';
import cn from 'classnames';
import { formatUnits } from "ethers";
import { ListRow } from '@components/ListRow/ListRow';
import { Text } from '@components/Text/Text';
import { shortenWalletAddress, styleguide, useReduxSelector } from '@react-shared';
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


  const renderRow = (
    index: number,
    title: string,
    description: string,
    icon: React.ReactElement,
    selected: boolean,
    broadcaster: Optional<SelectedBroadcaster>,
    customOnSelect?: () => void,
  ) => {
    return (
      <ListRow
        key={index}
        title={<Text className={styles.titleStyle}>{title}</Text>}
        description={
          <div className={styles.descriptionContainer}>
            <Text className={styles.descriptionTextStyle}>{description}</Text>
          </div>
        }
        descriptionClassName={styles.descriptionStyle}
        selected={selected}
        leftView={() => <div className={styles.iconContainer}>{icon}</div>}
        onSelect={customOnSelect ?? (() => onSelect(broadcaster))}
      />
    );
  };

  const renderBroadcaster = (broadcaster: SelectedBroadcaster, index: number) => {
    const icon = renderIcon(
      IconType.Send,
      22,
      styleguide.colors.lighterLabelSecondary,
    );
    const selected = broadcaster.railgunAddress === selectedBroadcaster?.railgunAddress;

    const {wrappedSymbol} =  network.current.baseToken;

    const feeBigInt = BigInt(broadcaster.tokenFee.feePerUnitGas);
    const formattedFee = formatUnits(feeBigInt, decimals);
    const parsedFee = parseFloat(formattedFee);
    const parsedDecimals = parsedFee > 1 ? 4 : 8;
    const formatedParsedFee = parsedFee.toFixed(parsedDecimals);


    return renderRow(
      index,
      shortenWalletAddress(broadcaster.railgunAddress), `Fee Ratio (${formatedParsedFee} ${feeTokenName} : 1 ${wrappedSymbol.slice(1)})`, icon,
      selected,
      broadcaster,
    );
  };

  const renderRandomBroadcasterRow = () => {
    return renderRow(
      -1,
      'Random Broadcaster',
      'Auto-select random Public Broadcaster',
      renderIcon(IconType.Public, 22, styleguide.colors.lighterLabelSecondary),
      false, undefined, onSelectRandom,
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
