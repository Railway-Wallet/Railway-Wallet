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
  maxBigIntForTransaction,
  TransactionType,
  WalletAddressType,
} from '@react-shared';
import { validateWalletAddress } from '@utils/validation';
import {
  ShieldERC20ApproveData,
  ShieldERC20ConfirmData,
  ShieldERC20sView,
  ShieldERC20sViewData,
} from '../ShieldERC20s';
import styles from './ShieldInitial.module.scss';

type Props = {
  handleSetView: (view: ShieldERC20sView, data: ShieldERC20sViewData) => void;
  navigationToken?: ERC20Token;
  approvedToken?: ERC20Token;
  initialERC20AmountRecipients?: ERC20AmountRecipient[];
};

export const ShieldERC20sInitial = ({
  handleSetView,
  navigationToken,
  approvedToken,
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
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const transactionType = TransactionType.Shield;
  const walletAddressType = WalletAddressType.Railgun;

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
    const data: ShieldERC20ConfirmData = {
      erc20AmountRecipients,
    };
    handleSetView(ShieldERC20sView.CONFIRM, data);
  };

  const openApproveForShielding = (token: ERC20Token) => {
    const approveERC20Amount: ERC20Amount = {
      token,
      amountString: maxBigIntForTransaction().toString(),
    };

    const data: ShieldERC20ApproveData = {
      erc20AmountRecipients,
      approveERC20Amount,
    };

    handleSetView(ShieldERC20sView.APPROVE, data);
  };

  return (
    <>
      <div className={styles.shieldInitialContainer}>
        <Text className={styles.description}>
          Please enter a private RAILGUN address, select tokens and enter
          amounts to shield.
        </Text>
        {recipientInput}
        <ERC20AmountsEntry
          transactionType={TransactionType.Shield}
          canSendMultipleTokens={true}
          isRailgunBalance={false}
          balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
          initialToken={approvedToken ?? navigationToken}
          tokenAmounts={erc20AmountRecipients}
          requiresAddTokens={undefined}
          setTokenAmounts={setERC20Amounts}
          showAmountEntry={showAmountEntry}
          setShowAmountEntry={setShowAmountEntry}
          openApproveForShielding={openApproveForShielding}
        />
        <Button
          buttonClassName={styles.nextButton}
          disabled={!hasValidRecipient || showAmountEntry}
          textClassName={styles.nextButtonText}
          onClick={onTapNext}
        >
          Next
        </Button>
      </div>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
