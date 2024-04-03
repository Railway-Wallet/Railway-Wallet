import { isDefined } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import { ListRow } from '@components/ListRow/ListRow';
import { Text } from '@components/Text/Text';
import {
  compareTokenAddress,
  FrontendWallet,
  SavedAddress,
  shortenWalletAddress,
  styleguide,
  useReduxSelector,
} from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { CustomWalletAddressModal } from '../../settings/CustomWalletAddressModal/CustomWalletAddressModal';
import styles from './SelectWalletList.module.scss';

type Props = {
  isRailgun: boolean;
  selectedWallet?: FrontendWallet;
  selectedAddress?: string;
  onSelect: (
    wallet?: FrontendWallet,
    address?: string,
    removeSelectedWallet?: boolean,
  ) => void;
  showRelayerOption?: boolean;
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
  showRelayerOption = false,
  showNoDestinationWalletOption = false,
  showCustomAddressDestinationOption = false,
  availableWalletsOnly = false,
  showSavedAddresses = false,
}) => {
  const { wallets } = useReduxSelector('wallets');
  const { savedAddresses } = useReduxSelector('savedAddresses');

  const [showCustomWalletAddressModal, setShowCustomWalletAddressModal] =
    useState(false);

  const renderRightView = (rightText: string) => {
    return (
      <div className={styles.rightBalances}>
        <Text className={styles.rightTextStyle}>{rightText}</Text>
      </div>
    );
  };

  const walletAddress = (wallet: FrontendWallet) => {
    if (isRailgun || wallet.isViewOnlyWallet) {
      return wallet.railAddress;
    }
    if (wallet.ethAddress) {
      return wallet.ethAddress;
    }
    return '';
  };

  const savedWalletAddress = (savedAddress: SavedAddress) => {
    if (isRailgun && isDefined(savedAddress.railAddress)) {
      return savedAddress.railAddress;
    }
    if (!isRailgun && isDefined(savedAddress.ethAddress)) {
      return savedAddress.ethAddress;
    }
    return '';
  };

  const renderRow = (
    index: number,
    title: string,
    description: string,
    icon: React.ReactElement,
    rightText: string,
    selected: boolean,
    removeSelectedWallet: boolean,
    wallet?: FrontendWallet,
    address?: string,
    customOnSelect?: () => void,
  ) => {
    return (
      <ListRow
        key={index}
        title={<Text className={styles.titleStyle}>{title}</Text>}
        description={
          <div className={styles.descriptionContainer}>
            <Text className={styles.descriptionTextStyle}>{description}</Text>
          </div>
        }
        descriptionClassName={styles.descriptionStyle}
        selected={selected}
        leftView={() => <div className={styles.iconContainer}>{icon}</div>}
        rightView={() => renderRightView(rightText)}
        onSelect={
          customOnSelect ??
          (() => onSelect(wallet, address, removeSelectedWallet))
        }
      />
    );
  };

  const renderWallet = (wallet: FrontendWallet, index: number) => {
    const title = wallet.name;
    const address = walletAddress(wallet);
    const icon = renderIcon(
      wallet.isViewOnlyWallet ? IconType.Eye : IconType.Wallet,
      22,
      styleguide.colors.lighterLabelSecondary,
    );
    const rightText = wallet.isViewOnlyWallet ? 'View-only' : 'EVM wallet';
    const selected =
      wallet.id === selectedWallet?.id ||
      compareTokenAddress(address, selectedAddress);

    return renderRow(
      index,
      title,
      shortenWalletAddress(address), icon,
      rightText,
      selected,
      false, wallet,
      address,
    );
  };

  const renderNoWalletPrivateDestinationRow = () => {
    return renderRow(
      -3,
      'Private Wallet',
      'Use active wallet',
      renderIcon(
        IconType.LockClosed,
        22,
        styleguide.colors.lighterLabelSecondary,
      ),
      '',
      selectedAddress == null,
      true,
    );
  };

  const promptCustomAddress = () => {
    setShowCustomWalletAddressModal(true);
  };

  const hasMatchingSelectedWalletOrAddress = () => {
    const hasMatchingAvailableWallet =
      wallets.available.find(wallet => {
        return compareTokenAddress(walletAddress(wallet), selectedAddress);
      }) == null;
    if (hasMatchingAvailableWallet) {
      return true;
    }
    const hasMatchingSavedAddress =
      savedAddresses.current.find(savedAddress => {
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
      'Custom address',
      selected && isDefined(selectedAddress)
        ? shortenWalletAddress(selectedAddress)
        : isRailgun
        ? 'Enter a private address'
        : 'Enter a public address',
      renderIcon(IconType.Edit, 22, styleguide.colors.lighterLabelSecondary),
      '',
      selected,
      false, undefined, undefined, promptCustomAddress,
    );
  };

  const renderRelayerRow = () => {
    return renderRow(
      -1,
      'Relayer',
      'Auto-select best Relayer',
      renderIcon(IconType.Send, 22, styleguide.colors.lighterLabelSecondary),
      'External',
      selectedWallet == null,
      true,
    );
  };

  const renderSavedAddressRow = (savedAddress: SavedAddress, index: number) => {
    const title = savedAddress.name;
    const address = savedWalletAddress(savedAddress);
    const icon = renderIcon(
      IconType.Save,
      22,
      styleguide.colors.lighterLabelSecondary,
    );
    const rightText = 'Saved address';
    const selected =
      !selectedWallet && compareTokenAddress(address, selectedAddress);

    return renderRow(
      index,
      title,
      shortenWalletAddress(address), icon,
      rightText,
      selected,
      false, undefined, address,
    );
  };

  const savedAddressOptions: SavedAddress[] = savedAddresses.current.filter(
    savedAddress => {
      return (
        (isRailgun && isDefined(savedAddress.railAddress)) ||
        (!isRailgun && isDefined(savedAddress.ethAddress))
      );
    },
  );

  return (
    <>
      {showCustomWalletAddressModal && (
        <CustomWalletAddressModal
          isRailgun={isRailgun}
          selectedAddress={selectedAddress}
          onClose={(customAddress?: string) => {
            setShowCustomWalletAddressModal(false);
            if (isDefined(customAddress)) {
              onSelect(undefined, customAddress, false);
            }
          }}
        />
      )}
      <div className={cn(styles.container, 'hide-scroll')}>
        {!wallets.available.length && !showRelayerOption && (
          <Text className={styles.placeholder}>No wallets available.</Text>
        )}
        {showNoDestinationWalletOption &&
          isRailgun &&
          renderNoWalletPrivateDestinationRow()}
        {showCustomAddressDestinationOption &&
          renderCustomAddressDestinationRow()}
        {showRelayerOption && renderRelayerRow()}
        {wallets.available.map(renderWallet)}
        {!availableWalletsOnly && wallets.viewOnly.map(renderWallet)}
        {showSavedAddresses && savedAddressOptions.map(renderSavedAddressRow)}
      </div>
    </>
  );
};
