import { ChainType, Network } from '@railgun-community/shared-models';
import React, { useState } from 'react';
import cn from 'classnames';
import { ListItem } from '@components/ListItem/ListItem';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { getSupportedNetworks, useReduxSelector } from '@react-shared';
import { IconType, renderIcon } from '@services/util/icon-service';
import { SettingsNetworkInfoModal } from '../SettingsNetworkInfoModal/SettingsNetworkInfoModal';
import styles from '../SettingsWalletsModal/SettingsWalletsModal.module.scss';

type Props = {
  onClose: (closeAllModals: boolean) => void;
};

export const SettingsNetworksModal: React.FC<Props> = ({ onClose }) => {
  const { network } = useReduxSelector('network');

  const activeNetworkName = network.current.name;

  const [selectedNetwork, setSelectedNetwork] = useState<Optional<Network>>();

  const handleCloseNetwork = (closeAllModals: boolean) => {
    setSelectedNetwork(undefined);
    if (closeAllModals) {
      onClose(closeAllModals);
    }
  };

  const networks = getSupportedNetworks();

  const chainTypeDescription = (network: Network) => {
    switch (network.chain.type) {
      case ChainType.EVM: {
        return `EVM network: ${network.chain.id}`;
      }
    }
  };

  const networkItem = (network: Network, index: number) => {
    const isLastItem = index === networks.length - 1;
    const isActive = network.name === activeNetworkName;

    return (
      <div key={index}>
        <ListItem
          title={network.publicName}
          titleIcon={isActive ? IconType.Check : undefined}
          className={styles.listItem}
          description={chainTypeDescription(network)}
          onPress={() => setSelectedNetwork(network)}
          descriptionClassName={styles.walletItemDescription}
          right={() => (
            <div className={styles.rightContainer}>
              {renderIcon(IconType.ChevronRight, 18)}
            </div>
          )}
        />
        {!isLastItem && <div className={styles.hr} />}
      </div>
    );
  };

  return (
    <>
      <GenericModal onClose={() => onClose(false)} title="Networks">
        <div className={cn(styles.walletItemContainer, 'hide-scroll')}>
          {networks.map(networkItem)}
        </div>
      </GenericModal>
      {selectedNetwork && (
        <SettingsNetworkInfoModal
          selectedNetwork={selectedNetwork}
          onClose={handleCloseNetwork}
        />
      )}
    </>
  );
};
