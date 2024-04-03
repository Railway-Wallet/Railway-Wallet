import { isDefined } from '@railgun-community/shared-models';
import React, { useEffect, useState } from 'react';
import cn from 'classnames';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { isElectron } from '@utils/user-agent';
import styles from './ErrorDetailsModal.module.scss';

export type ErrorDetailsModalProps = {
  error: Error;
  onDismiss?: () => void;
};

export const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({
  error,
  onDismiss,
}) => {
  const appVersion = process.env.REACT_APP_VERSION;
  const chromeVersion = navigator.userAgent.match(
    /Chrom(e|ium)\/([0-9]+)\./,
  )?.[2];

  const [messages, setMessages] = useState<Array<string>>([]);
  const [architecture, setArchitecture] = useState<Optional<string>>();
  const [platform, setPlatform] = useState<Optional<string>>();
  useEffect(() => {
    const newMessages = [];
    let thisErr: Error = error;
    while (thisErr?.message ?? thisErr) {
      newMessages.push(thisErr.message ?? String(thisErr));
      thisErr = thisErr?.cause as Error;
    }
    setMessages(newMessages);

    const fetchDetails = async () => {
      const info = await navigator.userAgentData?.getHighEntropyValues([
        'architecture',
      ]);
      setArchitecture(info?.architecture);
      setPlatform(info?.platform);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchDetails();
  }, [error]);

  return (
    <GenericModal
      shouldCloseOnOverlayClick={isDefined(onDismiss)}
      onClose={onDismiss ?? (() => {})}
      title="Error details"
      showClose={true}
    >
      <Text className={cn('selectable-text')} style={{ marginBottom: 20 }}>
        (Railway {isElectron() ? 'Desktop' : 'Web'} {appVersion}, Chrome{' '}
        {chromeVersion}, {platform} {architecture})
      </Text>
      {messages.map((message, index) => (
        <div key={index}>
          {index > 0 && (
            <Text
              key={`causedby${index}`}
              className={cn(styles.causedBy, 'selectable-text')}
            >
              caused by
            </Text>
          )}
          <Text
            key={index}
            className={cn(styles.errorMessage, 'selectable-text')}
          >
            {message}
          </Text>
        </div>
      ))}
    </GenericModal>
  );
};
