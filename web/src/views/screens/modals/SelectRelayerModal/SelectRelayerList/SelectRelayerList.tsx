import { isDefined, SelectedRelayer } from '@railgun-community/shared-models';
import React from 'react';
import cn from 'classnames';
import { formatUnits } from "ethers";
import { ListRow } from '@components/ListRow/ListRow';
import { Text } from '@components/Text/Text';
import { shortenWalletAddress, styleguide, useReduxSelector } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './SelectRelayerList.module.scss';

type Props = {
  selectedRelayer: Optional<SelectedRelayer>;
  allRelayers: Optional<SelectedRelayer[]>;
  decimals: Optional<number>;
  feeTokenName: Optional<string>;
  onSelect: (relayer: Optional<SelectedRelayer>) => void;
  onSelectRandom: () => void;
};

export const SelectRelayerList: React.FC<Props> = ({
  selectedRelayer,
  allRelayers,
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
    relayer: Optional<SelectedRelayer>,
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
        onSelect={customOnSelect ?? (() => onSelect(relayer))}
      />
    );
  };

  const renderRelayer = (relayer: SelectedRelayer, index: number) => {
    const icon = renderIcon(
      IconType.Send,
      22,
      styleguide.colors.lighterLabelSecondary,
    );
    const selected = relayer.railgunAddress === selectedRelayer?.railgunAddress;

    const {wrappedSymbol} =  network.current.baseToken;

    const feeBigInt = BigInt(relayer.tokenFee.feePerUnitGas);
    const formattedFee = formatUnits(feeBigInt, decimals);
    const parsedFee = parseFloat(formattedFee);
    const parsedDecimals = parsedFee > 1 ? 4 : 8;
    const formatedParsedFee = parsedFee.toFixed(parsedDecimals);
    

    return renderRow(
      index,
      shortenWalletAddress(relayer.railgunAddress), `Fee Ratio (${formatedParsedFee} ${feeTokenName} : 1 ${wrappedSymbol.slice(1)})`, icon,
      selected,
      relayer,
    );
  };

  const renderRandomRelayerRow = () => {
    return renderRow(
      -1,
      'Random Relayer',
      'Auto-select random Public Relayer',
      renderIcon(IconType.Public, 22, styleguide.colors.lighterLabelSecondary),
      false, undefined, onSelectRandom,
    );
  };

  return (
    <>
      <div className={cn(styles.container, 'hide-scroll')}>
        {!isDefined(allRelayers) && (
          <Text className={styles.placeholder}>Loading...</Text>
        )}
        {isDefined(allRelayers) && allRelayers.length === 0 && (
          <Text className={styles.placeholder}>
            No public relayers found for fee token.
          </Text>
        )}
        {isDefined(allRelayers) && allRelayers.length > 0 && (
          <>
            {renderRandomRelayerRow()}
            {allRelayers.map(renderRelayer)}
          </>
        )}
      </div>
    </>
  );
};
