import {
  NFTAmount,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { NFTAmountsEntry } from '@components/amounts-entry/NFTAmountsEntry';
import { Button } from '@components/Button/Button';
import { Text } from '@components/Text/Text';
import { useRecipientAddress } from '@hooks/useRecipientAddress';
import { TransactionType, WalletAddressType } from '@react-shared';
import { validateWalletAddress } from '@utils/validation';
import {
  SendNFTsConfirmData,
  SendNFTsView,
  SendNFTsViewData,
} from '../SendNFTs';
import styles from './SendInitial.module.scss';

type Props = {
  handleSetView: (view: SendNFTsView, data: SendNFTsViewData) => void;
  navigationNFTAmount?: NFTAmount;
  isRailgun: boolean;
  initialNFTAmountRecipients?: NFTAmountRecipient[];
};

export const SendNFTsInitial = ({
  handleSetView,
  navigationNFTAmount,
  isRailgun,
  initialNFTAmountRecipients = [],
}: Props) => {
  const firstInitialRecipient = initialNFTAmountRecipients.length
    ? initialNFTAmountRecipients[0]
    : undefined;

  const [nftAmounts, setNFTAmounts] = useState<NFTAmount[]>(
    initialNFTAmountRecipients,
  );

  const [showAmountEntry, setShowAmountEntry] = useState(
    initialNFTAmountRecipients.length < 1,
  );

  const transactionType = TransactionType.Send;
  const walletAddressType = isRailgun
    ? WalletAddressType.Railgun
    : WalletAddressType.Ethereum;

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const { hasValidRecipient, nftAmountRecipients, recipientInput } =
    useRecipientAddress(
      firstInitialRecipient?.recipientAddress,

      undefined, [], nftAmounts,
      transactionType,
      walletAddressType,
      validateWalletAddress,
      setAlert,
    );

  const onTapNext = () => {
    const data: SendNFTsConfirmData = {
      nftAmountRecipients,
    };
    handleSetView(SendNFTsView.CONFIRM, data);
  };

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <>
      <div className={styles.sendInitialContainer}>
        <Text className={styles.description}>
          {isRailgun
            ? 'Please enter a private recipient address, select tokens and enter amounts to transfer.'
            : 'Please enter a public recipient address, select a token and enter an amount to transfer.'}
        </Text>
        {recipientInput}
        <NFTAmountsEntry
          transactionType={transactionType}
          canSendMultipleNFTs={isRailgun}
          isRailgunBalance={isRailgun}
          balanceBucketFilter={balanceBucketFilter}
          initialNFTAmount={navigationNFTAmount}
          nftAmounts={nftAmounts}
          setNFTAmounts={setNFTAmounts}
          showAmountEntry={showAmountEntry}
          setShowAmountEntry={setShowAmountEntry}
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
