import { useState } from 'react';
import { ElectronRendererWindow, isElectron } from '@utils/user-agent';
import { Button } from '@views/components/Button/Button';
import { Input } from '@views/components/Input/Input';
import { GenericModal } from '@views/components/modals/GenericModal/GenericModal';
import styles from './WipeDeviceDataModal.module.scss';

type Props = {
  onClose: (closeAllModals: boolean) => void;
};

export const WipeDeviceDataModal = ({ onClose }: Props) => {
  const [inputValue, setInputValue] = useState('');
  const isDesktop = isElectron();

  const updateInputValue = (e: React.BaseSyntheticEvent) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const handleWipeDeviceData = () => {
    if (!isDesktop) {
      console.error('Wipe Device Data is only available in desktop');
      return;
    }

    const renderer = window as unknown as ElectronRendererWindow;
    renderer.electronBridge.wipeDeviceData();
  };

  return (
    <>
      <GenericModal
        onClose={() => onClose(false)}
        isBackChevron
        title="Wipe Device Data"
        accessoryView={
          <Button
            children="Delete data"
            disabled={inputValue !== 'I understand'}
            onClick={handleWipeDeviceData}
            buttonClassName={styles.submitButton}
          />
        }
      >
        <div className={styles.container}>
          <p>
            {`This action will delete all app data. Save your seed phrase or funds will be lost.\n\nType "I understand" to proceed.`}
          </p>
          <Input
            value={inputValue}
            onChange={updateInputValue}
            placeholder={''}
            autoFocus
          />
        </div>
      </GenericModal>
    </>
  );
};
