import { Popover } from 'react-tiny-popover';
import { Button } from '@components/Button/Button';
import { IconType } from '@services/util/icon-service';
import styles from './AddWalletPopover.module.scss';
import application from '@scss/application.module.scss';

type Props = {
  isOpen: boolean;
  onOpenAddWallet: () => void;
  onCloseAddWallet: () => void;
  onCreateWallet: () => void;
  onImportWallet: () => void;
  onAddViewOnlyWallet: () => void;
  onImportFromBackup: () => void;
};

export const AddWalletPopover: React.FC<Props> = ({
  isOpen,
  onOpenAddWallet,
  onCloseAddWallet,
  onCreateWallet,
  onImportWallet,
  onAddViewOnlyWallet,
  onImportFromBackup,
}) => {
  return (
    <Popover
      isOpen={isOpen}
      content={
        <div className={styles.popoverContent}>
          <Button
            buttonClassName={styles.button}
            textClassName={styles.buttonText}
            onClick={onCreateWallet}
          >
            Create new wallet
          </Button>
          <div className={styles.hr} />
          <Button
            buttonClassName={styles.button}
            textClassName={styles.buttonText}
            onClick={onImportWallet}
          >
            Import using seed phrase
          </Button>
          <div className={styles.hr} />
          <Button
            buttonClassName={styles.button}
            textClassName={styles.buttonText}
            onClick={onImportFromBackup}
          >
            Import from backup file
          </Button>
          <div className={styles.hr} />
          <Button
            buttonClassName={styles.button}
            textClassName={styles.buttonText}
            onClick={onAddViewOnlyWallet}
          >
            Add view-only wallet
          </Button>
        </div>
      }
      onClickOutside={onCloseAddWallet}
      positions={['bottom']}
      containerStyle={{ zIndex: application.zIndexSubmenus }}
    >
      <Button
        buttonClassName={styles.addButton}
        endIcon={IconType.Plus}
        alt="add tokens"
        iconSize={24}
        onClick={onOpenAddWallet}
      >
        Add Wallet
      </Button>
    </Popover>
  );
};
