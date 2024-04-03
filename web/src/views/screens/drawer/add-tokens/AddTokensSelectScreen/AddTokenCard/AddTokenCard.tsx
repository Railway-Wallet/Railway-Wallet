import { useState } from 'react';
import cn from 'classnames';
import { Text } from '@components/Text/Text';
import { Checkbox } from '@views/components/Checkbox/Checkbox';
import styles from './AddTokenCard.module.scss';

type Props = {
  icon?: string;
  symbol: string;
  name: string;
};

export const AddERC20Card = ({ icon, symbol, name }: Props) => {
  const [checked, setChecked] = useState(false);

  const handleCheck = () => setChecked(prevState => !prevState);

  return (
    <div
      className={cn(styles.addERC20CardContainer, {
        [styles.checkedContainer]: checked,
      })}
    >
      <div className={styles.cardContent}>
        <img src={icon} alt={`${name} icon`} className={styles.image} />
        <div>
          <Text
            fontWeight={800}
            className={checked ? styles.checkedTokenText : styles.tokenText}
          >
            {name}
          </Text>
          <Text
            fontWeight={900}
            className={checked ? styles.checkedSymbolText : styles.symbolText}
          >
            {symbol}
          </Text>
        </div>
      </div>
      <Checkbox medium checked={checked} handleCheck={handleCheck} />
    </div>
  );
};
