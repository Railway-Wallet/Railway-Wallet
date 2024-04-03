import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { ERC20AmountsEntry } from '@components/amounts-entry/ERC20AmountsEntry';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import { useRecipientAddress } from '@hooks/useRecipientAddress';
import {
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  TransactionType,
  WalletAddressType,
} from '@react-shared';
import { validateWalletAddress } from '@utils/validation';
import {
  SendERC20sConfirmData,
  SendERC20sView,
  SendERC20sViewData,
} from '../SendERC20s';
import styles from './SendInitial.module.scss';

type Props = {
  handleSetView: (view: SendERC20sView, data: SendERC20sViewData) => void;
  navigationToken?: ERC20Token;
  isRailgun: boolean;
  initialERC20AmountRecipients?: ERC20AmountRecipient[];
};

export const SendERC20sInitial = ({
  handleSetView,
  navigationToken,
  isRailgun,
  initialERC20AmountRecipients = [],
}: Props) => {
  const firstInitialRecipient =
    isDefined(initialERC20AmountRecipients) &&
    initialERC20AmountRecipients.length
      ? initialERC20AmountRecipients[0]
      : undefined;

  const [erc20Amounts, setERC20Amounts] = useState<ERC20Amount[]>(
    initialERC20AmountRecipients.map(tar => ({
      token: tar.token,
      amountString: tar.amountString,
    })),
  );

  const [showAmountEntry, setShowAmountEntry] = useState(
    initialERC20AmountRecipients.length < 1,
  );

  const transactionType = TransactionType.Send;
  const walletAddressType = isRailgun
    ? WalletAddressType.Railgun
    : WalletAddressType.Ethereum;

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const { hasValidRecipient, erc20AmountRecipients, recipientInput } =
    useRecipientAddress(
      firstInitialRecipient?.recipientAddress,
      firstInitialRecipient?.externalUnresolvedToWalletAddress,
      erc20Amounts,
      [], transactionType,
      walletAddressType,
      validateWalletAddress,
      setAlert,
    );

  const onTapNext = () => {
    const data: SendERC20sConfirmData = {
      erc20AmountRecipients,
    };
    handleSetView(SendERC20sView.CONFIRM, data);
  };

  return (
    <>
      <div className={styles.sendInitialContainer}>
        <Text className={styles.description}>
          {isRailgun
            ? 'Please enter a private recipient address, select tokens and enter amounts to transfer.'
            : 'Please enter a public recipient address, select a token and enter an amount to transfer.'}
        </Text>
        {recipientInput}
        <ERC20AmountsEntry
          transactionType={TransactionType.Send}
          canSendMultipleTokens={isRailgun}
          isRailgunBalance={isRailgun}
          balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
          initialToken={navigationToken}
          tokenAmounts={erc20AmountRecipients}
          setTokenAmounts={setERC20Amounts}
          showAmountEntry={showAmountEntry}
          setShowAmountEntry={setShowAmountEntry}
          requiresAddTokens={undefined}
        />
        <Button
          buttonClassName={styles.nextButton}
          disabled={!hasValidRecipient || showAmountEntry}
          textClassName={styles.nextButtonText}
          onClick={onTapNext}
          testId="send-erc20-next-button"
        >
          Next
        </Button>
      </div>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
