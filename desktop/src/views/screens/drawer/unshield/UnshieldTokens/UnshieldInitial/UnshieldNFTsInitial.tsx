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
import {
  TransactionType,
  useReduxSelector,
  WalletAddressType,
} from '@react-shared';
import { validateWalletAddress } from '@utils/validation';
import {
  UnshieldNFTsConfirmData,
  UnshieldNFTsView,
  UnshieldNFTsViewData,
} from '../UnshieldNFTs';
import styles from './UnshieldInitial.module.scss';

type Props = {
  handleSetView: (view: UnshieldNFTsView, data: UnshieldNFTsViewData) => void;
  navigationNFTAmount?: NFTAmount;
  initialNFTAmountRecipients?: NFTAmountRecipient[];
};

export const UnshieldNFTsInitial = ({
  handleSetView,
  navigationNFTAmount,
  initialNFTAmountRecipients = [],
}: Props) => {
  const { network } = useReduxSelector('network');

  const firstInitialRecipient = initialNFTAmountRecipients.length
    ? initialNFTAmountRecipients[0]
    : undefined;

  const [balanceBucketFilter, setBalanceBucketFilter] = useState<
    RailgunWalletBalanceBucket[]
  >([RailgunWalletBalanceBucket.Spendable]);

  const [nftAmounts, setNFTAmounts] = useState<NFTAmount[]>(
    initialNFTAmountRecipients,
  );

  const [showAmountEntry, setShowAmountEntry] = useState(
    initialNFTAmountRecipients.length < 1,
  );
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const transactionType = TransactionType.Unshield;
  const walletAddressType = WalletAddressType.Ethereum;

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
    const data: UnshieldNFTsConfirmData = {
      nftAmountRecipients,
    };
    handleSetView(UnshieldNFTsView.CONFIRM, data);
  };

  return (
    <>
      <div className={styles.unshieldInitialContainer}>
        <Text className={styles.description}>
          Please enter a public {network.current.shortPublicName} address,
          select tokens and enter amounts to unshield.
        </Text>
        {recipientInput}
        <NFTAmountsEntry
          transactionType={transactionType}
          canSendMultipleNFTs={true}
          isRailgunBalance={true}
          balanceBucketFilter={balanceBucketFilter}
          initialNFTAmount={navigationNFTAmount}
          nftAmounts={nftAmounts}
          setNFTAmounts={setNFTAmounts}
          showAmountEntry={showAmountEntry}
          setShowAmountEntry={setShowAmountEntry}
        />
        <div className={styles.nextButtonWrapper}>
          <Button
            buttonClassName={styles.nextButton}
            disabled={!hasValidRecipient || showAmountEntry}
            textClassName={styles.nextButtonText}
            onClick={onTapNext}
          >
            Next
          </Button>
        </div>
      </div>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
