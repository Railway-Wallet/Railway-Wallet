import {
  isDefined,
  NFTAmount,
  NFTAmountRecipient,
} from "@railgun-community/shared-models";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, TextInput } from "react-native";
import { RecipientAddressInput } from "@components/inputs/RecipientAddressInput/RecipientAddressInput";
import {
  ERC20Amount,
  ERC20AmountRecipient,
  isSmartContract,
  TransactionType,
  useReduxSelector,
  WalletAddressType,
} from "@react-shared";

export const useRecipientAddress = (
  firstInitialRecipientAddress: Optional<string>,
  firstInitialRecipientExternalUnresolvedToWalletAddress: Optional<string>,
  erc20Amounts: ERC20Amount[],
  nftAmounts: NFTAmount[],
  transactionType: TransactionType,
  walletAddressType: WalletAddressType.Ethereum | WalletAddressType.Railgun,
  validateAddress: (
    address: string,
    isRailgunAddress: boolean
  ) => Promise<boolean>
) => {
  const { network } = useReduxSelector("network");

  const [address, setAddress] = useState(firstInitialRecipientAddress ?? "");
  const [
    externalUnresolvedToWalletAddress,
    setExternalUnresolvedToWalletAddress,
  ] = useState<Optional<string>>(
    firstInitialRecipientExternalUnresolvedToWalletAddress
  );

  const [hasValidRecipient, setHasValidRecipient] = useState(true);
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);

  const addressEntryRef = useRef<TextInput | null>(null);

  const isRailgunAddress = useCallback(() => {
    switch (walletAddressType) {
      case WalletAddressType.Railgun:
        return true;
      case WalletAddressType.Ethereum:
        return false;
    }
  }, [walletAddressType]);

  const setAddresses = useCallback(
    (
      newAddress: string,
      externalUnresolvedToWalletAddress: Optional<string>
    ) => {
      if (newAddress === address) {
        return;
      }
      setIsValidatingRecipient(true);
      setAddress(newAddress);
      setExternalUnresolvedToWalletAddress(externalUnresolvedToWalletAddress);
    },
    [address]
  );

  const nftAmountRecipients: NFTAmountRecipient[] = useMemo(() => {
    return nftAmounts.map((nft) => ({
      ...nft,
      recipientAddress: address,
      externalUnresolvedToWalletAddress,
    }));
  }, [address, externalUnresolvedToWalletAddress, nftAmounts]);

  const erc20AmountRecipients: ERC20AmountRecipient[] = useMemo(() => {
    return erc20Amounts.map((ta) => ({
      token: ta.token,
      amountString: ta.amountString,
      recipientAddress: address,
      externalUnresolvedToWalletAddress,
    }));
  }, [address, erc20Amounts, externalUnresolvedToWalletAddress]);

  const alertIfValidatedIncorrectAddressType = useCallback(async () => {
    if (await validateAddress(address, !isRailgunAddress())) {
      Alert.alert(
        "Incorrect address type",
        isRailgunAddress()
          ? "You must use a private 0zk RAILGUN address for this transaction."
          : "You must use a public address for this transaction."
      );
    }
  }, [address, validateAddress, isRailgunAddress]);

  const alertIfSmartContractPublicAddress = useCallback(async () => {
    if (
      walletAddressType === WalletAddressType.Ethereum &&
      (await isSmartContract(network.current.name, address))
    ) {
      Alert.alert(
        "Warning",
        "The selected address appears to be a smart contract. Certain smart contracts cannot receive funds directly. Please make sure this recipient accepts smart contract deposits, and double-check the destination address."
      );
    }
  }, [address, network, walletAddressType]);

  useEffect(() => {
    const validateEntries = async () => {
      setHasValidRecipient(false);
      const isValidRecipient =
        isDefined(address) &&
        (await validateAddress(address, isRailgunAddress()));

      setHasValidRecipient(isValidRecipient);
      setIsValidatingRecipient(false);

      if (isValidRecipient) {
        await alertIfSmartContractPublicAddress();
        return;
      }

      await alertIfValidatedIncorrectAddressType();
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    validateEntries();
  }, [
    address,
    alertIfSmartContractPublicAddress,
    alertIfValidatedIncorrectAddressType,
    isRailgunAddress,
    validateAddress,
  ]);

  return {
    hasValidRecipient,
    nftAmountRecipients,
    erc20AmountRecipients,
    recipientInput: (
      <RecipientAddressInput
        initialAddress={address}
        setAddresses={setAddresses}
        hasValidRecipient={hasValidRecipient}
        isValidatingRecipient={isValidatingRecipient}
        walletAddressType={walletAddressType}
        transactionType={transactionType}
        addressEntryRef={addressEntryRef}
      />
    ),
  };
};
