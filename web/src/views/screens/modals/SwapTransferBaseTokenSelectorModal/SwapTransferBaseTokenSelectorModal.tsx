import { Button } from '@components/Button/Button';
import { GenericModal } from '@components/modals/GenericModal/GenericModal';
import { Text } from '@components/Text/Text';
import { useReduxSelector } from '@react-shared';
import styles from './SwapTransferBaseTokenSelector.module.scss';

type Props = {
  onClose: (transferToBaseToken: boolean) => void;
};

export const SwapTransferBaseTokenSelectorModal: React.FC<Props> = ({
  onClose,
}) => {
  const { network } = useReduxSelector('network');

  return (
    <GenericModal
      onClose={() => onClose(false)}
      shouldCloseOnOverlayClick={false}
      showClose={false}
      title="Swap Result"
    >
      <div>
        <Text
          className={styles.description}
        >{`You are swapping and transferring to a public address. Would you like the result to be ${network.current.baseToken.symbol} or ${network.current.baseToken.wrappedSymbol}?`}</Text>
        <div className={styles.buttonsContainer}>
          <Button
            children={`Swap to ${network.current.baseToken.symbol}`}
            buttonClassName={styles.fullLengthButtonStyle}
            onClick={() => onClose(true)}
          />
          <Button
            children={`Swap to ${network.current.baseToken.wrappedSymbol}`}
            buttonClassName={styles.fullLengthButtonStyle}
            onClick={() => onClose(false)}
          />
        </div>
      </div>
    </GenericModal>
  );
};
