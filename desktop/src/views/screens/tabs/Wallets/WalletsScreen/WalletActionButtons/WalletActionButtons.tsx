import { NetworkName } from '@railgun-community/shared-models';
import { Button } from '@components/Button/Button';
import { useReduxSelector } from '@react-shared';
import { IconType } from '@services/util/icon-service';
import { TokenActionType } from '../WalletsScreen';
import styles from './WalletActionButtons.module.scss';

interface ButtonProps {
  handleOpenActionModal: (type: TokenActionType) => void;
  isRailgun: boolean;
}

export const WalletActionButtons = ({
  handleOpenActionModal,
  isRailgun,
}: ButtonProps) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const activeWallet = wallets.active;

  const canMintTestTokens =
    network.current.name === NetworkName.EthereumRopsten_DEPRECATED &&
    !isRailgun;

  return (
    <div className={styles.container}>
      {activeWallet && (
        <>
          <Button
            children="Send"
            endIcon={IconType.Send}
            onClick={() => handleOpenActionModal(TokenActionType.SEND_TOKENS)}
            buttonClassName={styles.button}
            disabled={activeWallet.isViewOnlyWallet}
            testId="wallet-action-send"
          />
          <Button
            children="Receive"
            endIcon={IconType.Receive}
            onClick={() =>
              handleOpenActionModal(TokenActionType.RECEIVE_TOKENS)
            }
            buttonClassName={styles.button}
            testId="wallet-action-receive"
          />
          {isRailgun ? (
            <Button
              children="Unshield"
              endIcon={IconType.Public}
              onClick={() =>
                handleOpenActionModal(TokenActionType.UNSHIELD_TOKENS)
              }
              buttonClassName={styles.button}
              disabled={activeWallet.isViewOnlyWallet}
              testId="wallet-action-unshield"
            />
          ) : (
            <Button
              children="Shield"
              endIcon={IconType.Shield}
              onClick={() =>
                handleOpenActionModal(TokenActionType.SHIELD_TOKENS)
              }
              buttonClassName={styles.button}
              testId="wallet-action-shield"
            />
          )}
          {canMintTestTokens && (
            <Button
              children="Mint tokens"
              endIcon={IconType.PlusCircle}
              onClick={() =>
                handleOpenActionModal(TokenActionType.MINT_TEST_TOKENS)
              }
              buttonClassName={styles.button}
            />
          )}
        </>
      )}
      {!activeWallet && (
        <>
          <Button
            children="Import wallet"
            endIcon={IconType.Import}
            onClick={() => handleOpenActionModal(TokenActionType.IMPORT_WALLET)}
            buttonClassName={styles.fullLengthButtonStyle}
          />
          <Button
            children="Create wallet"
            endIcon={IconType.PlusCircle}
            onClick={() => handleOpenActionModal(TokenActionType.CREATE_WALLET)}
            buttonClassName={styles.fullLengthButtonStyle}
          />
        </>
      )}
    </div>
  );
};
