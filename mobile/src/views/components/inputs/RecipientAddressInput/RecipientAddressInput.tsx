import { isDefined } from "@railgun-community/shared-models";
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import { TextInput } from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  AddressResolverStatus,
  ResolvedAddressType,
  shortenWalletAddress,
  styleguide,
  TransactionType,
  useAddressResolver,
  useAppDispatch,
  useReduxSelector,
  useSavedAddresses,
  WalletAddressType,
} from "@react-shared";
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from "@screens/modals/ErrorDetailsModal/ErrorDetailsModal";
import { ScanQRCodeModal } from "@screens/modals/ScanQRCodeModal/ScanQRCodeModal";
import { callActionSheet } from "@services/util/action-sheet-options-service";
import { showSaveAddressPrompt } from "@services/util/alert-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { TextEntry } from "../TextEntry/TextEntry";
import { styles } from "./styles";

type ActionSheetOption = {
  name: string;
  action: () => void;
};

type Props = {
  initialAddress?: string;
  setAddresses: (
    address: string,
    externalUnresolvedToWalletAddress: Optional<string>
  ) => void;
  hasValidRecipient: boolean;
  isValidatingRecipient: boolean;
  walletAddressType: WalletAddressType.Ethereum | WalletAddressType.Railgun;
  transactionType: TransactionType;
  addressEntryRef: MutableRefObject<TextInput | null>;
};

export const RecipientAddressInput: React.FC<Props> = ({
  initialAddress,
  setAddresses,
  hasValidRecipient,
  walletAddressType,
  transactionType,
  addressEntryRef,
  isValidatingRecipient,
}) => {
  const dispatch = useAppDispatch();
  const { network } = useReduxSelector("network");
  const { showActionSheetWithOptions } = useActionSheet();

  const isRailgunAddress = walletAddressType === WalletAddressType.Railgun;
  let placeholder: string;

  const [addressText, setAddressText] = useState<string>(initialAddress ?? "");
  const [showScanQRCodeModal, setShowScanQRCodeModal] = useState(false);
  const [errorModal, setErrorModal] =
    useState<Optional<ErrorDetailsModalProps>>(undefined);
  const [_, setAddressFocused] = useState(false);

  switch (walletAddressType) {
    case WalletAddressType.Ethereum:
      placeholder = `Enter ${network.current.shortPublicName} address`;
      break;
    case WalletAddressType.Railgun:
      placeholder = `Enter RAILGUN address`;
      break;
  }

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
    setAddresses(resolvedAddress ?? "", getExternalUnresolvedToWalletAddress());
  }, [
    addressResolverStatus,
    addressText,
    getExternalUnresolvedToWalletAddress,
    resolvedAddress,
    resolvedAddressType,
    setAddresses,
  ]);

  useEffect(() => {
    if (
      addressResolverStatus === AddressResolverStatus.Error &&
      isDefined(addressResolverError)
    ) {
      setErrorModal({
        show: true,
        error: addressResolverError,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  }, [addressResolverError, addressResolverStatus]);

  const saveAddressError = (error: Error) => {
    setErrorModal({
      show: true,
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
    saveAddressError
  );

  const onTapSaveWallet = () => {
    triggerHaptic(HapticSurface.EditButton);

    const savedWalletAddressType =
      resolvedAddressType === ResolvedAddressType.RawText
        ? walletAddressType
        : WalletAddressType.ExternalResolved;

    showSaveAddressPrompt((name: string) =>
      saveWalletAddress(addressText, name, savedWalletAddressType)
    );
  };

  const actionSheetOptions: ActionSheetOption[] = [
    ...availableWalletOptions,
    ...savedAddressOptions,
  ];

  const onTapWallets = () => {
    addressEntryRef.current?.blur();
    triggerHaptic(HapticSurface.NavigationButton);
    callActionSheet(
      showActionSheetWithOptions,
      isRailgunAddress
        ? `Shielded wallets`
        : `${network.current.publicName} wallets`,
      [...availableWalletOptions, ...savedAddressOptions]
    );
  };

  const onTapQrCode = () => {
    addressEntryRef.current?.blur();
    triggerHaptic(HapticSurface.NavigationButton);
    setShowScanQRCodeModal(true);
  };

  const onDismissQRCodeModal = (qrCodeAddress?: string) => {
    if (isDefined(qrCodeAddress)) {
      setAddressText(qrCodeAddress);
    }
    setShowScanQRCodeModal(false);
  };

  const hasWalletOptions = actionSheetOptions.length > 0;

  const labelText = () => {
    if (addressResolverStatus === AddressResolverStatus.Resolving) {
      return "Resolving...";
    }
    if (
      isDefined(resolvedAddress) &&
      resolvedAddressType !== ResolvedAddressType.RawText
    ) {
      return shortenWalletAddress(resolvedAddress);
    }
    if (isDefined(knownWalletName)) {
      return knownWalletName;
    }
    return isRailgunAddress ? "Shielded wallet" : "Public wallet";
  };

  const invalidResolvedRecipient =
    (initialAddress?.length ?? 0) > 0 &&
    addressText.length > 0 &&
    addressResolverStatus === AddressResolverStatus.Resolved &&
    !isValidatingRecipient &&
    !hasValidRecipient;

  const hasError =
    addressResolverStatus === AddressResolverStatus.Error ||
    invalidResolvedRecipient;

  return (
    <>
      <ScanQRCodeModal
        show={showScanQRCodeModal}
        onDismiss={onDismissQRCodeModal}
      />
      <TextEntry
        viewStyles={[
          styles.addressInput,
          hasError ? styles.addressInputError : undefined,
        ]}
        label={labelText()}
        value={addressText}
        onChangeText={setAddressText}
        autoCapitalize="none"
        multiline
        placeholder={placeholder}
        iconButtons={[
          {
            icon: "content-save-outline",
            onTap: onTapSaveWallet,
            disabled:
              !hasValidRecipient ||
              addressResolverStatus === AddressResolverStatus.Error ||
              !shouldEnableSaveWallet,
          },
          { icon: "qrcode-scan", onTap: onTapQrCode },
          {
            icon: "wallet-outline",
            onTap: onTapWallets,
            disabled: !hasWalletOptions,
          },
        ]}
        autoComplete="off"
        labelIcon={
          addressText.length && hasValidRecipient ? "check-bold" : undefined
        }
        labelIconColor={styleguide.colors.txGreen()}
        labelIconSize={18}
        reference={addressEntryRef}
        textContentType="none"
        onFocus={() => setAddressFocused(true)}
        onBlur={() => setAddressFocused(false)}
      />
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </>
  );
};
