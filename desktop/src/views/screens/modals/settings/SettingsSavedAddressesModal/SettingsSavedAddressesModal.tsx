import { isDefined } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import { ListItem } from '@components/ListItem/ListItem';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import {
  SavedAddress,
  SavedAddressService,
 shortenWalletAddress,  useAppDispatch,
  useReduxSelector } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { Button } from '@views/components/Button/Button';
import { AddSavedAddressModal } from '../AddSavedAddressModal/AddSavedAddressModal';
import styles from '../SettingsWalletsModal/SettingsWalletsModal.module.scss';

type Props = {
  onClose: (closeAllModals: boolean) => void;
};

export const SettingsSavedAddressesModal: React.FC<Props> = ({ onClose }) => {
  const { savedAddresses } = useReduxSelector('savedAddresses');
  const [showAddSavedAddressModal, setShowAddSavedAddressModal] =
    useState(false);
  const dispatch = useAppDispatch();

  const deleteAddress = (address: SavedAddress) => {
    const savedAddressService = new SavedAddressService(dispatch);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    savedAddressService.delete(address);
  };

  const descriptionItem = (savedAddress: SavedAddress) => {
    return (
      <div>
        {isDefined(savedAddress.railAddress) && (
          <Text className={styles.walletItemDescription}>
            Private address: {shortenWalletAddress(savedAddress.railAddress)}
          </Text>
        )}
        {isDefined(savedAddress.ethAddress) && (
          <Text className={styles.walletItemDescription}>
            Public address: {shortenWalletAddress(savedAddress.ethAddress)}
          </Text>
        )}
        {isDefined(savedAddress.externalResolvedAddress) && (
          <Text className={styles.walletItemDescription}>
            Resolved address: {savedAddress.externalResolvedAddress}
          </Text>
        )}
      </div>
    );
  };

  const savedAddressItem = (savedAddress: SavedAddress, index: number) => {
    const isLastItem = index === savedAddresses.current.length - 1;

    return (
      <div key={index}>
        <ListItem
          title={savedAddress.name}
          className={cn(styles.listItem, styles.listItemNoHover)}
          description={descriptionItem(savedAddress)}
          descriptionClassName={styles.walletItemDescription}
          right={() => (
            <div
              className={cn(
                styles.rightContainer,
                styles.rightContainerClickable,
              )}
              onClick={() => {
                deleteAddress(savedAddress);
              }}
            >
              {renderIcon(IconType.Trash, 18)}
            </div>
          )}
        />
        {!isLastItem && <div className={styles.hr} />}
      </div>
    );
  };

  return (
    <>
      <GenericModal
        onClose={() => onClose(false)}
        title="Saved Addresses"
        accessoryView={
          <Button onClick={() => setShowAddSavedAddressModal(true)}>Add</Button>
        }
      >
        <div className={cn(styles.walletItemContainer, 'hide-scroll')}>
          {savedAddresses.current.map(savedAddressItem)}
          {!savedAddresses.current.length && (
            <Text className={styles.placeholderText}>No saved addresses.</Text>
          )}
        </div>
      </GenericModal>
      {showAddSavedAddressModal && (
        <>
          <AddSavedAddressModal
            onClose={async () => {
              setShowAddSavedAddressModal(false);
            }}
          />
        </>
      )}
    </>
  );
};
