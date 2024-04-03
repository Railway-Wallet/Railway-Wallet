import { isDefined, NetworkName } from '@railgun-community/shared-models';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyledActionSheet } from '@components/ActionSheet/StyledActionSheet';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { Text } from '@components/Text/Text';
import { ActionSheetRef } from '@railway-developer/actionsheet-react';
import {
  AddressResolverStatus,
  logDevError,
  ResolvedAddressType,
  SharedConstants,
  styleguide,
  TransactionType,
  useAddressResolver,
  useAppDispatch,
  useReduxSelector,
  useSavedAddresses,
  WalletAddressType,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@views/screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import styles from './RecipientAddressInput.module.scss';

type ActionSheetOption = {
  name: string;
  action: () => void;
};

type Props = {
  initialAddress: string;
  setAddresses: (
    address: string,
    externalUnresolvedToWalletAddress: Optional<string>,
  ) => void;
  hasValidRecipient: boolean;
  isValidatingRecipient: boolean;
  walletAddressType: WalletAddressType.Ethereum | WalletAddressType.Railgun;
  transactionType: TransactionType;
};

export const RecipientAddressInput: React.FC<Props> = ({
  initialAddress,
  setAddresses,
  hasValidRecipient,
  isValidatingRecipient,
  walletAddressType,
  transactionType,
}) => {
  const { network } = useReduxSelector('network');

  const [addressText, setAddressText] = useState<string>(initialAddress ?? '');
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  let placeholder: string;
  switch (walletAddressType) {
    case WalletAddressType.Ethereum:
      placeholder = `Enter ${network.current.shortPublicName} address`;
      break;
    case WalletAddressType.Railgun:
      placeholder = `Enter RAILGUN address`;
      break;
  }

  const isRailgunAddress = walletAddressType === WalletAddressType.Railgun;

  const dispatch = useAppDispatch();

  const {
    addressResolverStatus,
    addressResolverError,
    resolvedAddress,
    resolvedAddressType,
  } = useAddressResolver(addressText, network.current.name, isRailgunAddress);

  const getExternalUnresolvedToWalletAddress =
    useCallback((): Optional<string> => {
      if (
        addressResolverStatus === AddressResolverStatus.Resolved &&
        resolvedAddressType !== ResolvedAddressType.RawText
      ) {
        return addressText;
      }
      return undefined;
    }, [addressResolverStatus, addressText, resolvedAddressType]);

  useEffect(() => {
    setAddresses(resolvedAddress ?? '', getExternalUnresolvedToWalletAddress());
  }, [
    addressResolverStatus,
    addressText,
    getExternalUnresolvedToWalletAddress,
    resolvedAddress,
    resolvedAddressType,
    setAddresses,
  ]);

  const saveAddressError = (error: Error) => {
    setErrorModal({
      error,
      onDismiss: () => setErrorModal(undefined),
    });
  };
  const {
    saveWalletAddress,
    shouldEnableSaveWallet,
    savedAddressOptions,
    availableWalletOptions,
    knownWalletName,
  } = useSavedAddresses(
    dispatch,
    walletAddressType,
    hasValidRecipient,
    addressText,
    transactionType,
    setAddressText,
    saveAddressError,
  );

  const onTapSaveWallet = () => {
    setAlert({
      title: 'Save this address',
      message: `${SharedConstants.MAX_LENGTH_WALLET_NAME} character limit`,
      onClose: () => setAlert(undefined),
      submitTitle: 'Confirm',
      onSubmit: async name => {
        setAlert(undefined);
        if (!isDefined(name) || name === '') {
          return;
        }
        try {
          const savedWalletAddressType =
            resolvedAddressType === ResolvedAddressType.RawText
              ? walletAddressType
              : WalletAddressType.ExternalResolved;

          await saveWalletAddress(addressText, name, savedWalletAddressType);
        } catch (cause) {
          const error = new Error('Save wallet failed', { cause });
          logDevError(error);
          setErrorModal({
            error,
            onDismiss: () => setErrorModal(undefined),
          });
        }
      },
      showInput: true,
      maxLength: SharedConstants.MAX_LENGTH_WALLET_NAME,
      inputPlaceholder: 'Address name',
    });
  };

  const actionSheetOptions: ActionSheetOption[] = [
    ...availableWalletOptions,
    ...savedAddressOptions,
  ];

  const actionSheetRef = useRef<ActionSheetRef>();

  const onSelectWallet = (option: ActionSheetOption) => {
    option.action();
    actionSheetRef.current?.close();
  };

  const onTapSelectWallets = () => {
    actionSheetRef.current?.open();
  };

  const saveWalletButton = (
    <Button
      children="SAVE"
      onClick={onTapSaveWallet}
      textClassName={styles.buttonLabel}
      buttonClassName={styles.inputInsetButton}
      disabled={
        !hasValidRecipient ||
        addressResolverStatus === AddressResolverStatus.Error ||
        !shouldEnableSaveWallet
      }
    />
  );

  const hasWalletOptions = actionSheetOptions.length > 0;

  const selectWalletsButton = hasWalletOptions ? (
    <Button
      children="SELECT"
      onClick={onTapSelectWallets}
      textClassName={styles.buttonLabel}
      buttonClassName={styles.inputInsetButton}
    />
  ) : undefined;

  const inputRightView = (
    <div className={styles.inputRightView}>
      {addressResolverStatus === AddressResolverStatus.Resolving && (
        <Spinner size={20} className={styles.inputSpinner} />
      )}
      {addressText.length > 0 ? saveWalletButton : selectWalletsButton}
    </div>
  );

  const invalidResolvedRecipient =
    initialAddress.length > 0 &&
    addressText.length > 0 &&
    addressResolverStatus === AddressResolverStatus.Resolved &&
    !isValidatingRecipient &&
    !hasValidRecipient;

  return (
    <>
      <div className={styles.recipientAddressInput}>
        <Text className={styles.recipientLabel}>Recipient:</Text>
        <Input
          onChange={e => setAddressText(e.target.value)}
          placeholder={placeholder}
          value={addressText}
          hasError={
            addressResolverStatus === AddressResolverStatus.Error ||
            invalidResolvedRecipient
          }
          isTextArea
          rightView={inputRightView}
          testId="address-input"
        />
        {isDefined(knownWalletName) && (
          <div className={styles.knownWalletContainer}>
            {renderIcon(IconType.Check, 16, styleguide.colors.txGreen())}
            <Text className={styles.knownWalletName}>{knownWalletName}</Text>
          </div>
        )}
        {addressResolverStatus === AddressResolverStatus.Resolved &&
          resolvedAddressType !== ResolvedAddressType.RawText && (
            <Text className={styles.resolvedAddressText}>
              Resolved to: {resolvedAddress}
            </Text>
          )}
        {invalidResolvedRecipient && (
          <Text className={styles.errorText}>Invalid recipient address</Text>
        )}
        {addressResolverStatus === AddressResolverStatus.Error &&
          isDefined(addressResolverError) && (
            <Text className={styles.errorText}>
              {addressResolverError.message}{' '}
            </Text>
          )}
        <StyledActionSheet
          title="Saved wallets"
          actionSheetRef={actionSheetRef}
          actionSheetOptions={actionSheetOptions}
          onSelectOption={onSelectWallet}
        />
      </div>
      {alert && <GenericAlert {...alert} />}
      {errorModal && <ErrorDetailsModal {...errorModal} />}
    </>
  );
};
