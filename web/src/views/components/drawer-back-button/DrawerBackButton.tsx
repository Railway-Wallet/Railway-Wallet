import { Text } from '@components/Text/Text';
import { IconType, renderIcon } from '@services/util/icon-service';
import styles from './DrawerBackButton.module.scss';

type Props = {
  text: string;
  handleBackButton: () => void;
};

export const DrawerBackButton = ({ text, handleBackButton }: Props) => {
  return (
    <div className={styles.topButtonContainer}>
      <div onClick={handleBackButton} className={styles.backButtonContainer}>
        <div className={styles.backButton}>
          {renderIcon(IconType.ChevronLeft, 24)}
        </div>
        <Text className={styles.backButtonText}>{text}</Text>
      </div>
    </div>
  );
};
