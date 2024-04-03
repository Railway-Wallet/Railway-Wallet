import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { DrawerName, EVENT_OPEN_DRAWER_WITH_DATA } from '@models/drawer-types';
import { OmittedPrivateTokensService, useAppDispatch } from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import styles from './OmittedPrivateTokensModal.module.scss';

type Props = {
  onClose: () => void;
  amount: number;
};

export const OmittedPrivateTokensModal: React.FC<Props> = ({
  onClose,
  amount,
}) => {
  const dispatch = useAppDispatch();

  const handleClose = async () => {
    const omittedPrivateTokensService = new OmittedPrivateTokensService(
      dispatch,
    );
    await omittedPrivateTokensService.shouldShowOmittedPrivateTokensModal(
      false,
    );
    onClose();
  };

  const handleReviewTokens = async () => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.AddTokens,
    });
    await handleClose();
  };

  return (
    <GenericModal onClose={handleClose} title="Found Tokens">
      <div>
        <Text
          className={styles.description}
        >{`Detected a private balance for ${amount} tokens that are not yet added to your wallet.`}</Text>
        <div className={styles.buttonsContainer}>
          <Button
            children="Review tokens"
            buttonClassName={styles.fullLengthButtonStyle}
            onClick={handleReviewTokens}
          />
          <Button
            children="Skip"
            buttonClassName={styles.fullLengthButtonStyle}
            onClick={handleClose}
          />
        </div>
      </div>
    </GenericModal>
  );
};
