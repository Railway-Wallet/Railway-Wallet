import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { TextButton } from '@components/TextButton/TextButton';
import { StorageService } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { Constants } from '@utils/constants';
import { AddCustomPOIListModal } from '../AddCustomPOIListModal/AddCustomPOIListModal';
import styles from '../SettingsWalletInfoModal/SettingsWalletInfoModal.module.scss';

type Props = {
  onClose: (closeAllModals: boolean) => void;
};

export const POIListsModal = ({ onClose }: Props) => {
  const [addedLists, setAddedLists] = useState<string[]>();
  const [showApplyChanges, setShowApplyChanges] = useState<boolean>(false);
  const [alert, setAlert] = useState<Optional<AlertProps>>();
  const [openAddCustomListModal, setOpenAddCustomListModal] =
    useState<boolean>(false);

  useEffect(() => {
    const getAndSetAlreadyAddedLists = async () => {
      const alreadyAddedLists = await StorageService.getItem(
        Constants.POI_CUSTOM_LISTS,
      );
      setAddedLists(
        isDefined(alreadyAddedLists) ? JSON.parse(alreadyAddedLists) : [],
      );
    };

    if (!addedLists) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      getAndSetAlreadyAddedLists();
    }
  }, [addedLists]);

  const handleRemoveList = (listToRemove: string) => async () => {
    setAlert({
      title: 'Remove list',
      message: 'Are you sure you want to remove this list?',
      submitTitle: 'Yes',
      onClose: () => setAlert(undefined),
      onSubmit: async () => {
        const newLists = addedLists?.filter(list => list !== listToRemove);
        await StorageService.setItem(
          Constants.POI_CUSTOM_LISTS,
          JSON.stringify(newLists),
        );
        setAddedLists(newLists);
        setShowApplyChanges(true);
        setAlert(undefined);
      },
    });
  };

  return (
    <>
      <GenericModal
        onClose={() => onClose(false)}
        isBackChevron
        title="Private Proof of Innocence Lists"
      >
        <div className={styles.itemCard}>
          <div className={styles.itemInnerContainer}>
            <div className={styles.flexContainer}>
              <Text className={styles.subheader}>Custom lists</Text>
            </div>
          </div>
          {addedLists?.length === 0 && (
            <Text className={styles.label}>
              No custom Private POI list added.
            </Text>
          )}
          {addedLists?.map((list, index) => (
            <TextButton
              key={index}
              text={list}
              textClassName={styles.label}
              action={handleRemoveList(list)}
            />
          ))}
        </div>
        <div
          className={cn(styles.itemCard, styles.itemContainerUpperSpacing)}
          onClick={() => {
            setOpenAddCustomListModal(true);
          }}
        >
          <div className={styles.phraseHeader}>
            <Text>Add custom Private POI list</Text>
            {renderIcon(IconType.PlusCircle, 20)}
          </div>
        </div>
        {showApplyChanges && (
          <>
            <Text className={styles.warningText}>
              To apply the changes you need to restart Railway
            </Text>
            <div
              className={cn(styles.itemCard, styles.itemContainerUpperSpacing)}
              onClick={() => {
                window.location.reload();
              }}
            >
              <div className={styles.phraseHeader}>
                <Text>Restart Railway</Text>
                {renderIcon(IconType.Refresh, 20)}
              </div>
            </div>
          </>
        )}
      </GenericModal>
      {alert && <GenericAlert {...alert} />}
      {openAddCustomListModal && (
        <AddCustomPOIListModal
          onClose={() => setOpenAddCustomListModal(false)}
        />
      )}
    </>
  );
};
