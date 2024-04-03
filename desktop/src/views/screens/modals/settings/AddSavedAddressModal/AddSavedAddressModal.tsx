import { isDefined } from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import {
  logDevError,
  SavedAddressService,
  SharedConstants,
  useAppDispatch,
 validateEthAddress, validateRailgunAddress,  WalletAddressType } from '@react-shared';
import { Text } from '@views/components/Text/Text';
import styles from './AddSavedAddress.module.scss';

type Props = {
  onClose: () => void;
};

export const AddSavedAddressModal = ({ onClose }: Props) => {
  const [addressName, setAddressName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [addressType, setAddressType] = useState<Optional<WalletAddressType>>();
  const [hasValidName, setHasValidName] = useState(false);
  const [hasValidRecipient, setHasValidRecipient] = useState(false);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [errorText, setErrorText] = useState<Optional<string>>(undefined);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const validateAddress = async () => {
      setIsValidatingRecipient(true);
      const validRailgunAddress = await validateRailgunAddress(address);
      if (validRailgunAddress) {
        setAddressType(WalletAddressType.Railgun);
        setHasValidRecipient(true);
        setIsValidatingRecipient(false);
        return;
      }

      const validEthAddress = await validateEthAddress(address);
      setAddressType(validEthAddress ? WalletAddressType.Ethereum : undefined);
      setHasValidRecipient(validEthAddress);
      setIsValidatingRecipient(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    validateAddress();
  }, [address]);

  const onSubmit = async () => {
    if (
      !hasValidName ||
      !hasValidRecipient ||
      isValidatingRecipient ||
      !addressType
    ) {
      return;
    }

    setShowLoading(true);

    try {
      if (addressName.length > SharedConstants.MAX_LENGTH_WALLET_NAME) {
        throw new Error('Address name is too long.');
      }

      let ethAddress, railAddress, externalResolvedAddress;
      switch (addressType) {
        case WalletAddressType.Railgun:
          railAddress = address;
          break;
        case WalletAddressType.Ethereum:
          ethAddress = address;
          break;
        case WalletAddressType.ExternalResolved:
          externalResolvedAddress = address;
          break;
      }
      const savedAddressService = new SavedAddressService(dispatch);
      await savedAddressService.saveAddress(
        addressName,
        ethAddress,
        railAddress,
        externalResolvedAddress,
      );

      setShowLoading(false);
      onClose();
    } catch (error) {
      logDevError(error);
      setShowLoading(false);
      setErrorText(error.message);
    }
  };

  const updateAddressName = (e: React.BaseSyntheticEvent) => {
    const { value: name } = e.target;
    setAddressName(name);
    setHasValidName(name.length > 0);
  };

  const updateAddress = (e: React.BaseSyntheticEvent) => {
    const { value: address } = e.target;
    setAddress(address);
  };

  const invalidRecipient =
    address.length > 0 && !isValidatingRecipient && !hasValidRecipient;

  return (
    <>
      <GenericModal
        onClose={onClose}
        title="Add address"
        isBackChevron={true}
        accessoryView={
          <Button
            buttonClassName={styles.actionButton}
            onClick={onSubmit}
            disabled={
              !hasValidName || !hasValidRecipient || isValidatingRecipient
            }
          >
            Save
          </Button>
        }
      >
        <Text className={styles.explainer}>
          Save a private 0zk or public 0x address.
        </Text>
        <div className={styles.nameInputContainer}>
          <Input
            value={addressName}
            onChange={updateAddressName}
            placeholder="Address name"
          />
        </div>
        <Input
          value={address}
          onChange={updateAddress}
          placeholder="Address"
          hasError={invalidRecipient}
        />
        {isDefined(errorText) && (
          <div className={styles.errorTextContainer}>
            <Text className={styles.errorText}>{errorText}</Text>
          </div>
        )}
        {showLoading && <FullScreenSpinner />}
      </GenericModal>
    </>
  );
};
