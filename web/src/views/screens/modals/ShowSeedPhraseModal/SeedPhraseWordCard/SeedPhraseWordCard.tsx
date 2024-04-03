import { Text } from '@components/Text/Text';
import { CardProps } from './types';
import styles from './SeedPhraseWordCard.module.scss';

export const SeedPhraseWordCard = ({ text }: CardProps) => {
  return (
    <div className={styles.card}>
      <Text>{text}</Text>
    </div>
  );
};
