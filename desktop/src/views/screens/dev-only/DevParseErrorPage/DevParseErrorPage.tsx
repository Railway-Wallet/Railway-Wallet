import React, { SyntheticEvent, useState } from 'react';
import cn from 'classnames';
import { Interface } from 'ethers';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { Text } from '@components/Text/Text';
import { abi, logDev, logDevError } from '@react-shared';
import styles from './DevParseErrorPage.module.scss';

type Props = {};

type StatusText = {
  message: string;
  isError: boolean;
};

export const DevParseErrorPage: React.FC<Props> = () => {
  const [statusText, setStatusText] = useState<StatusText>({
    message: '',
    isError: false,
  });
  const [dataField, setDataField] = useState('');

  const onSubmit = (e?: SyntheticEvent) => {
    e?.preventDefault();

    setStatusText({ message: '', isError: false });

    try {
      const IF = new Interface(abi.erc20);
      const message = IF.parseTransaction({ data: dataField });
      logDev(message);
      setStatusText({ message: JSON.stringify(message), isError: true });
    } catch (err) {
      logDevError(err);
      setStatusText({ message: err.message, isError: true });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.descriptionContainer}>
        <Text className={styles.description}>
          Enter 'data' field from error here:
        </Text>
      </div>
      <form onSubmit={onSubmit} className="create-password-modal-form">
        <Input
          value={dataField}
          onChange={e => setDataField(e.target.value)}
          placeholder="Error DATA field"
        />
        <Button
          buttonClassName={styles.submitButton}
          onClick={onSubmit}
          disabled={!dataField.length}
        >
          Submit
        </Button>
      </form>
      <div className={styles.statusTextContainer}>
        <Text
          className={cn(styles.statusText, {
            [styles.statusTextError]: statusText.isError,
          })}
        >
          {statusText.message}
        </Text>
      </div>
    </div>
  );
};
