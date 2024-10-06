import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Alert, Text, View } from "react-native";
import { ListRow } from "@components/list/ListRow/ListRow";
import {
  compareTokenAddress,
  FrontendWallet,
  SavedAddress,
  shortenWalletAddress,
  styleguide,
  useReduxSelector,
} from "@react-shared";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { Icon, IconSource } from "@views/components/icons/Icon";
import { promptAlert } from "../../../../../services/util/alert-service";
import { validateWalletAddress } from "../../../../../utils/validation";
import { styles } from "./styles";

type Props = {
  isRailgun: boolean;
  selectedWallet?: FrontendWallet;
  selectedAddress?: string;
  onSelect: (
    wallet?: FrontendWallet,
    address?: string,
    removeSelectedWallet?: boolean
  ) => void;
  showBroadcasterOption?: boolean;
  showNoDestinationWalletOption?: boolean;
  showCustomAddressDestinationOption?: boolean;
  availableWalletsOnly?: boolean;
  showSavedAddresses?: boolean;
};

export const SelectWalletList: React.FC<Props> = ({
  isRailgun,
  selectedWallet,
  selectedAddress,
  onSelect,
  showBroadcasterOption = false,
  showNoDestinationWalletOption = false,
  showCustomAddressDestinationOption = false,
  availableWalletsOnly = false,
  showSavedAddresses = false,
}) => {
  const { wallets } = useReduxSelector("wallets");
  const { savedAddresses } = useReduxSelector("savedAddresses");

  const renderRightView = (rightText: string) => {
    return (
      <View style={styles.rightBalances}>
        <Text style={styles.rightTextStyle}>{rightText}</Text>
      </View>
    );
  };

  const walletAddress = (wallet: FrontendWallet) => {
    if (isRailgun || wallet.isViewOnlyWallet) {
      return wallet.railAddress;
    }
    if (wallet.ethAddress) {
      return wallet.ethAddress;
    }
    return "";
  };

  const savedWalletAddress = (savedAddress: SavedAddress) => {
    if (isRailgun && isDefined(savedAddress.railAddress)) {
      return savedAddress.railAddress;
    }
    if (!isRailgun && isDefined(savedAddress.ethAddress)) {
      return savedAddress.ethAddress;
    }
    return "";
  };

  const renderRow = (
    index: number,
    title: string,
    description: string,
    icon: IconSource,
    rightText: string,
    selected: boolean,
    removeSelectedWallet: boolean,
    wallet?: FrontendWallet,
    address?: string,
    customOnSelect?: () => void
  ) => {
    const iconView = () => (
      <View style={styles.leftIconView}>
        <Icon source={icon} size={20} color={styleguide.colors.textSecondary} />
      </View>
    );

    return (
      <ListRow
        key={index}
        title={title}
        description={description}
        selected={selected}
        leftView={iconView}
        rightView={() => renderRightView(rightText)}
        onSelect={() => {
          triggerHaptic(HapticSurface.SelectItem);
          customOnSelect
            ? customOnSelect()
            : onSelect(wallet, address, removeSelectedWallet);
        }}
      />
    );
  };

  const renderWallet = (wallet: FrontendWallet, index: number) => {
    const title = wallet.name;
    const address = walletAddress(wallet);
    const icon = wallet.isViewOnlyWallet ? "eye-outline" : "wallet-outline";
    const rightText = wallet.isViewOnlyWallet ? "View-only" : "EVM wallet";
    const selected =
      wallet.id === selectedWallet?.id ||
      compareTokenAddress(address, selectedAddress);

    return renderRow(
      index,
      title,
      shortenWalletAddress(address),
      icon,
      rightText,
      selected,
      false,
      wallet,
      address
    );
  };

  const renderNoWalletPrivateDestinationRow = () => {
    return renderRow(
      -3,
      "Private Wallet",
      "Use active wallet",
      "lock-outline",
      "",
      selectedAddress == null,
      true
    );
  };

  const promptCustomAddress = () => {
    promptAlert(
      isRailgun ? "Custom private address" : "Custom public address",
      isRailgun ? "Enter a 0zk address." : "Enter a 0x address.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Set",
          onPress: async (customAddress?: string) => {
            if (isDefined(customAddress)) {
              const isValidAddress = await validateWalletAddress(
                customAddress,
                isRailgun
              );
              if (!isValidAddress) {
                Alert.alert(
                  "Invalid address",
                  "Please check your entered address.",
                  [
                    {
                      text: "OK",
                      style: "cancel",
                    },
                  ]
                );
                return;
              }
              onSelect(undefined, customAddress, false);
            }
          },
        },
      ],
      undefined,
      selectedAddress
    );
  };

  const hasMatchingSelectedWalletOrAddress = () => {
    const hasMatchingAvailableWallet =
      wallets.available.find((wallet) => {
        return compareTokenAddress(walletAddress(wallet), selectedAddress);
      }) == null;
    if (hasMatchingAvailableWallet) {
      return true;
    }
    const hasMatchingSavedAddress =
      savedAddresses.current.find((savedAddress) => {
        const address = savedWalletAddress(savedAddress);
        return compareTokenAddress(address, selectedAddress);
      }) == null;
    if (hasMatchingSavedAddress) {
      return true;
    }
    return false;
  };

  const renderCustomAddressDestinationRow = () => {
    const hasSelectedSavedAddressOrWallet =
      hasMatchingSelectedWalletOrAddress();
    const selected =
      !selectedWallet &&
      isDefined(selectedAddress) &&
      !hasSelectedSavedAddressOrWallet;

    return renderRow(
      -2,
      "Custom address",
      selected && isDefined(selectedAddress)
        ? shortenWalletAddress(selectedAddress)
        : isRailgun
        ? "Enter a private address"
        : "Enter a public address",
      "pencil-outline",
      "",
      selected,
      false,
      undefined,
      undefined,
      promptCustomAddress
    );
  };

  const renderBroadcasterRow = () => {
    return renderRow(
      -1,
      "Broadcaster",
      "Auto-select Broadcaster",
      "upload-outline",
      "External",
      selectedWallet == null,
      true
    );
  };

  const renderSavedAddressRow = (savedAddress: SavedAddress, index: number) => {
    const title = savedAddress.name;
    const address = savedWalletAddress(savedAddress);
    const icon = "content-save-outline";
    const rightText = "Saved address";
    const selected =
      !selectedWallet && compareTokenAddress(address, selectedAddress);

    return renderRow(
      index,
      title,
      shortenWalletAddress(address),
      icon,
      rightText,
      selected,
      false,
      undefined,
      address
    );
  };

  const savedAddressOptions: SavedAddress[] = savedAddresses.current.filter(
    (savedAddress) => {
      return (
        (isRailgun && isDefined(savedAddress.railAddress)) ||
        (!isRailgun && isDefined(savedAddress.ethAddress))
      );
    }
  );

  const sortedWallets = [...wallets.available].sort((a, b) => {
    if (a?.isActive && !b?.isActive) {
      return -1;
    }
    return 1;
  });

  return (
    <View style={styles.container}>
      {!wallets.available.length && !showBroadcasterOption && (
        <Text style={styles.placeholder}>No wallets available.</Text>
      )}
      {showNoDestinationWalletOption &&
        isRailgun &&
        renderNoWalletPrivateDestinationRow()}
      {showCustomAddressDestinationOption &&
        renderCustomAddressDestinationRow()}
      {showBroadcasterOption && renderBroadcasterRow()}
      {sortedWallets.map(renderWallet)}
      {!availableWalletsOnly && wallets.viewOnly.map(renderWallet)}
      {showSavedAddresses && savedAddressOptions.map(renderSavedAddressRow)}
    </View>
  );
};
