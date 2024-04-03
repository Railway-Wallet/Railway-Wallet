import React from 'react';
import cn from 'classnames';
import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { DrawerName, EVENT_OPEN_DRAWER_WITH_DATA } from '@models/drawer-types';
import {
  FrontendWallet,
  getSupportedEVMNetworkLogos,
  ImageRailgunLogo,
  styleguide,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType } from '@services/util/icon-service';
import { NewWalletCard } from './NewWalletCard/NewWalletCard';
import styles from './NewWalletSuccess.module.scss';

interface NewWalletSuccessModalProps {
  wallet: FrontendWallet;
  onClose: () => void;
}

export const NewWalletSuccessModal: React.FC<NewWalletSuccessModalProps> = ({
  wallet,
  onClose,
}) => {
  const onTapQrCodeButton = (isRailgun: boolean, walletType: string) => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.ReceiveTokens,
      extraData: {
        isRailgun: isRailgun,
        titleOverride: !isRailgun ? walletType : undefined,
      },
    });
  };

  const evmLogos = getSupportedEVMNetworkLogos();

  return (
    <GenericModal onClose={onClose} title="Wallet details">
      <div className={cn(styles.newWalletSuccessContainer, 'hide-scroll')}>
        <NewWalletCard
          walletType="RAILGUN 0zk"
          headerIcon={IconType.Shield}
          logos={[ImageRailgunLogo()]}
          address={wallet.railAddress}
          isViewOnlyWallet={wallet.isViewOnlyWallet}
          onTapQrCodeButton={walletType => onTapQrCodeButton(true, walletType)}
        />
        {!wallet.isViewOnlyWallet && (
          <NewWalletCard
            walletType="Public EVMs"
            headerIcon={IconType.Public}
            logos={evmLogos}
            address={wallet.ethAddress}
            backgroundColor={styleguide.colors.gray4()}
            onTapQrCodeButton={walletType =>
              onTapQrCodeButton(false, walletType)
            }
            className={styles.lastCard}
          />
        )}
      </div>
      <Button
        onClick={onClose}
        children="Finish"
        buttonClassName={styles.finishButton}
      />
    </GenericModal>
  );
};
