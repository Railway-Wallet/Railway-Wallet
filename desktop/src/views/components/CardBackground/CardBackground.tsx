import { ImageCardBackground } from '@assets/img/imagesWeb';
import styles from './CardBackground.module.scss';

type Props = {
  children: React.ReactNode;
  cardBackgroundOpacity: number;
};

export const CardBackground = ({ children, cardBackgroundOpacity }: Props) => {
  return (
    <div className={styles.cardBackgroundContainer}>
      <div
        className={styles.background}
        style={{
          opacity: cardBackgroundOpacity,
          backgroundImage: `url(${ImageCardBackground()})`,
        }}
      />
      <div className={styles.children}>{children}</div>
    </div>
  );
};
