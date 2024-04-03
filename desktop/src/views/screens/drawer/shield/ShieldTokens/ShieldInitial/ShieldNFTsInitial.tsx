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
  ShieldNFTsApproveData,
  ShieldNFTsConfirmData,
  ShieldNFTsView,
  ShieldNFTsViewData,
} from '../ShieldNFTs';
import styles from './ShieldInitial.module.scss';

type Props = {
  handleSetView: (view: ShieldNFTsView, data: ShieldNFTsViewData) => void;
  navigationNFTAmount?: NFTAmount;
  approvedNFTAmount?: NFTAmount;
  initialNFTAmountRecipients?: NFTAmountRecipient[];
};

export const ShieldNFTsInitial = ({
  handleSetView,
  navigationNFTAmount,
  approvedNFTAmount,
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

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const transactionType = TransactionType.Shield;
  const walletAddressType = WalletAddressType.Railgun;

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
    const data: ShieldNFTsConfirmData = {
      nftAmountRecipients,
    };
    handleSetView(ShieldNFTsView.CONFIRM, data);
  };

  const openApproveForShielding = (approveNFTAmount: NFTAmount) => {
    const data: ShieldNFTsApproveData = {
      nftAmountRecipients,
      approveNFTAmount,
    };

    handleSetView(ShieldNFTsView.APPROVE, data);
  };

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  return (
    <>
      <div className={styles.shieldInitialContainer}>
        <Text className={styles.description}>
          Please enter a private RAILGUN address and select NFTs to shield.
        </Text>
        {recipientInput}
        <NFTAmountsEntry
          transactionType={transactionType}
          canSendMultipleNFTs={true}
          isRailgunBalance={false}
          balanceBucketFilter={balanceBucketFilter}
          initialNFTAmount={approvedNFTAmount ?? navigationNFTAmount}
          nftAmounts={nftAmounts}
          setNFTAmounts={setNFTAmounts}
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
