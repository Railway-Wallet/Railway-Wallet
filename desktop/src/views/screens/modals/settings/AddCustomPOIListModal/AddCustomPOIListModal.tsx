import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { StorageService } from '@react-shared';
import { Constants } from '@utils/constants';
import styles from './AddCustomPOIListModal.module.scss';

type Props = {
  onClose: () => void;
};

export const AddCustomPOIListModal = ({ onClose }: Props) => {
  const [customList, setCustomList] = useState<string>();
  const [alert, setAlert] = useState<Optional<AlertProps>>();

  const updateCustomList = (e: React.BaseSyntheticEvent) => {
    const { value: list } = e.target;
    setCustomList(list);
  };

  return (
    <>
      <GenericModal
        onClose={onClose}
        title="Add custom POI list"
        isBackChevron
        accessoryView={
          <Button
            buttonClassName={styles.actionButton}
            onClick={async () => {
              setAlert({
                title: 'Added new custom list',
                message: 'Railway will now restart to apply this setting.',
                submitTitle: 'Ok',
                onClose: () => setAlert(undefined),
                onSubmit: async () => {
                  let newLists;
                  const alreadyAddedLists = await StorageService.getItem(
                    Constants.POI_CUSTOM_LISTS,
                  );

                  if (isDefined(alreadyAddedLists)) {
                    newLists = [...JSON.parse(alreadyAddedLists), customList];
                  } else {
                    newLists = [customList];
                  }

                  await StorageService.setItem(
                    Constants.POI_CUSTOM_LISTS,
                    JSON.stringify(newLists),
                  );
                  window.location.reload();
                },
              });
            }}
          >
            Submit
          </Button>
        }
      >
        <Input
          value={customList}
          onChange={updateCustomList}
          placeholder="Enter list key"
          hasError={isDefined(customList) && customList.length !== 64}
        />
      </GenericModal>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
