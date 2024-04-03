import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { Text } from '@components/Text/Text';
import { IconType, renderIcon } from '@services/util/icon-service';
import { ErrorDetailsModal } from '@views/screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { DrawerBackButton } from '../drawer-back-button/DrawerBackButton';
import styles from './RecipeLoadingView.module.scss';

type Props = {
  recipeError: Optional<Error>;
  recipeName: string;
  goBack: () => void;
};

export const RecipeLoadingView = ({
  recipeError,
  recipeName,
  goBack,
}: Props) => {
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);

  const showErrorDetails = () => {
    setErrorDetailsOpen(true);
  };
  const hideErrorDetails = () => {
    setErrorDetailsOpen(false);
  };

  if (isDefined(recipeError)) {
    return (
      <>
        <DrawerBackButton text="Go back" handleBackButton={goBack} />
        <div className={styles.errorContainer}>
          <Text className={styles.errorTitle}>Error</Text>
          <Text className={styles.errorMessage}>
            {recipeError.message}{' '}
            <Text className={styles.errorShowMore} onClick={showErrorDetails}>
              (show more)
            </Text>
          </Text>
        </div>
        {errorDetailsOpen && (
          <ErrorDetailsModal error={recipeError} onDismiss={hideErrorDetails} />
        )}
      </>
    );
  }

  return (
    <div className={styles.recipeLoadingViewContainer}>
      <div className={styles.textAndImageContainer}>
        {renderIcon(IconType.ChefHatIcon, 48)}
        <Text
          className={styles.loadingTitle}
        >{`Cooking up ${recipeName} Recipe...`}</Text>
      </div>
      <Spinner size={50} />
    </div>
  );
};
