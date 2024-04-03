import { isDefined } from '@railgun-community/shared-models';
import React from 'react';
import { Button } from '@components/Button/Button';
import {
  useReduxSelector,
  useShouldEnableSwaps,
  WalletCardSlideItem,
} from '@react-shared';
import { IconType } from '@services/util/icon-service';
import styles from './WalletCardSlideButtons.module.scss';

type Props = {
  hasWallet: boolean;
  item: WalletCardSlideItem;
  farmButtonText: Optional<string>
  onActionCreateWallet: () => void;
  onActionImportWallet: () => void;
  onActionUnshieldERC20s: () => void;
  onActionShieldERC20s: () => void;
  onActionSendERC20s: () => void;
  onActionReceiveTokens: () => void;
  onActionSwapERC20s: () => void;
  onActionFarmERC20s: () => void;
};

export const WalletCardSlideButtons: React.FC<Props> = ({
  hasWallet,
  farmButtonText,
  onActionCreateWallet,
  onActionImportWallet,
  onActionSendERC20s,
  onActionReceiveTokens,
  onActionSwapERC20s,
  onActionFarmERC20s,
}) => {
  const { wallets } = useReduxSelector('wallets');

  const activeWallet = wallets.active;

  const { shouldEnableSwaps } = useShouldEnableSwaps();

  const buttonsNoWallet = () => {
    return (
      <>
        <Button
          endIcon={IconType.Import}
          children="Import wallet"
          onClick={onActionImportWallet}
          buttonClassName={styles.button}
        />
        <Button
          endIcon={IconType.PlusCircle}
          children="Create wallet"
          onClick={onActionCreateWallet}
          buttonClassName={styles.button}
        />
      </>
    );
  };

  const buttonsActiveWallet = () => {
    return (
      <>
        <Button
          endIcon={IconType.Send}
          children="Send"
          onClick={onActionSendERC20s}
          buttonClassName={styles.button}
          disabled={activeWallet?.isViewOnlyWallet}
        />
        <Button
          endIcon={IconType.Receive}
          children="Receive"
          onClick={onActionReceiveTokens}
          buttonClassName={styles.button}
        />
        {isDefined(farmButtonText) && (
          <Button
            endIcon={IconType.TractorIcon}
            children={farmButtonText}
            onClick={onActionFarmERC20s}
            buttonClassName={styles.button}
          />
        )}
        <Button
          endIcon={IconType.Swap}
          children="Swap"
          onClick={onActionSwapERC20s}
          buttonClassName={styles.button}
          disabled={!shouldEnableSwaps}
        />
      </>
    );
  };

  return (
    <div className={styles.walletCardSlideButtonsContainer}>
      {hasWallet ? buttonsActiveWallet() : buttonsNoWallet()}
    </div>
  );
};
