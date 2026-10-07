import { Network } from '@railgun-community/shared-models';
import { useState } from 'react';
import { JsonRpcProvider } from 'ethers';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { logDevError, promiseTimeout } from '@react-shared';
import { ErrorDetailsModal, ErrorDetailsModalProps } from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import styles from './AddCustomRPCModal.module.scss';

type Props = {
  network: Network;
  onClose: (customRPCURL?: string) => void;
};

export const AddCustomRPCModal = ({ onClose, network }: Props) => {
  const [customRPCURL, setCustomRPCURL] = useState<string>('');
  const [hasValidEntries, setHasValidEntries] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const onSubmit = async () => {
    if (!hasValidEntries) {
      return;
    }

    setShowLoading(true);

    try {
      const provider = new JsonRpcProvider(customRPCURL, network.chain.id);
      await promiseTimeout(provider.getBlock('latest'), 5000);
      setShowLoading(false);
      onClose(customRPCURL);
    } catch (cause) {
      setShowLoading(false);
      if (!(cause instanceof Error)) {
        throw new Error('Unexpected non-error thrown', { cause });
      }
      let message = 'Please verify the URL for this provider.';
      if (cause.message.includes('underlying network changed')) {
        message = `This provider is not compatible with ${network.publicName}.`;
      }
      const error = new Error('Error connecting to RPC. ' + message, { cause });
      logDevError(error);
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      });
    }
  };

  const validateURLRegex = (str: string) => {
    var pattern = new RegExp(
      "^((https|wss)?:\\/\\/)?" + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + '((\\d{1,3}\\.){3}\\d{1,3}))' + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$',
      'i',
    );
    var localhost_pattern = new RegExp( "^http:\\/\\/localhost" + '(\\:\\d+)?' );
    return !!pattern.test(str) || !!localhost_pattern.test(str);
  };

  const isValidUrlWithProtocol = (str: string) => {
    let url;
    try {
      url = new URL(str);
    } catch (e) {
      return false;
    }
    return url.protocol === 'wss:' || url.protocol === 'https:' || url.protocol === 'http:';
  };

  const validateEntries = (url: string) => {
    setHasValidEntries(validateURLRegex(url) && isValidUrlWithProtocol(url));
  };

  const updateRPCURL = (e: React.BaseSyntheticEvent) => {
    const { value: url } = e.target;
    setCustomRPCURL(url);
    validateEntries(url);
  };

  return (
    <>
      <GenericModal
        onClose={onClose}
        title="Add custom RPC"
        isBackChevron={true}
        accessoryView={
          <Button
            buttonClassName={styles.actionButton}
            onClick={onSubmit}
            disabled={!hasValidEntries}
          >
            Submit
          </Button>
        }
      >
        <Input
          value={customRPCURL}
          onChange={updateRPCURL}
          placeholder="https://my.custom.rpc"
          hasError={customRPCURL.length > 0 && !hasValidEntries}
        />
        {showLoading && <FullScreenSpinner />}
      </GenericModal>
      {errorModal && <ErrorDetailsModal {...errorModal} />}
    </>
  );
};
