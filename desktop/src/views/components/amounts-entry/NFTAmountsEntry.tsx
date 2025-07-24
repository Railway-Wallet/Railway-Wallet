import {
  isDefined,
  NETWORK_CONFIG,
  NFTAmount,
  NFTTokenType,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import React, { useState } from 'react';
import { ApproveButton } from '@components/ApproveButton/ApproveButton';
import { Button } from '@components/Button/Button';
import { Input } from '@components/Input/Input';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';
import { Text } from '@components/Text/Text';
import {
  compareNFTs,
  TransactionType,
  useNFTCollectionApproved,
  useNFTImageURLs,
  useNFTMetadata,
  useRailgunShieldSpenderContract,
  useReduxSelector,
} from '@react-shared';
import { ErrorDetailsModal } from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { SelectNFTModal } from '@screens/modals/SelectTokenModal/SelectNFTModal';
import { IconType, renderIcon } from '@services/util/icon-service';
import { NFTAmountRowView } from './NFTAmountRowView';
import { SelectedNFTHighlight } from './SelectedNFTHighlight/SelectedNFTHighlight';
import styles from './AmountsEntry.module.scss';

type Props = {
  transactionType: TransactionType;
  canSendMultipleNFTs: boolean;
  isRailgunBalance: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
  initialNFTAmount: Optional<NFTAmount>;
  showAmountEntry: boolean;
  setShowAmountEntry: (value: boolean) => void;
  nftAmounts: NFTAmount[];
  setNFTAmounts: (value: NFTAmount[]) => void;
  openApproveForShielding?: (nft: NFTAmount) => void;
};

export const NFTAmountsEntry: React.FC<Props> = ({
  transactionType,
  canSendMultipleNFTs,
  isRailgunBalance,
  balanceBucketFilter,
  initialNFTAmount,
  showAmountEntry,
  setShowAmountEntry,
  nftAmounts,
  setNFTAmounts,
  openApproveForShielding,
}) => {
  const { network } = useReduxSelector('network');

  const [error, setError] = useState<Error>();
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const [showSelectNFTModal, setShowSelectNFTModal] = useState(false);

  const [numEntryString, setNumEntryString] = useState<string>(
    isDefined(initialNFTAmount) && isDefined(initialNFTAmount.amountString)
      ? BigInt(initialNFTAmount.amountString).toString()
      : '',
  );
  const [currentNFTAmount, setCurrentNFTAmount] =
    useState<Optional<NFTAmount>>(initialNFTAmount);

  const { metadata: currentNFTMetadata } = useNFTMetadata(currentNFTAmount);
  const { thumbnailURL } = useNFTImageURLs(currentNFTMetadata);

  const { shieldApproveSpender } = useRailgunShieldSpenderContract();
  const {
    nftApproved,
    pendingApproveNFTCollectionTransaction,
    resetNFTApproved,
    requiresApproval,
  } = useNFTCollectionApproved(
    currentNFTAmount,
    transactionType,
    shieldApproveSpender,
    isRailgunBalance,
    setError,
  );

  const nftBalanceString = '1';

  const hasValidNumEntry = true;
  const disableNumPad = true;

  const currentTokenCanSelectAmount =
    currentNFTAmount?.nftTokenType !== NFTTokenType.ERC721;

  const onTapNFTSelector = () => {
    setShowSelectNFTModal(true);
  };

  const onRemoveNFT = (removeNFT?: NFTAmount) => {
    const newNFTAmounts = [];
    for (const nftAmount of nftAmounts) {
      if (compareNFTs(nftAmount, removeNFT)) {
        continue;
      }
      newNFTAmounts.push(nftAmount);
    }
    setNFTAmounts(newNFTAmounts);
    setShowAmountEntry(false);
  };

  const onCancelERC1155Amount = () => {
    setShowAmountEntry(false);
  };

  const onDismissSelectNFTModal = async (nftAmount?: NFTAmount) => {
    setShowSelectNFTModal(false);
    if (!nftAmount) {
      return;
    }

    setCurrentNFTAmount(nftAmount);
    setNumEntryString(BigInt(nftAmount.amountString).toString());
    setShowAmountEntry(true);
    await resetNFTApproved();
  };

  const onSelectNFTAmount = (nftAmount: NFTAmount) => {
    setCurrentNFTAmount(nftAmount);
    onRemoveNFT(nftAmount);
    setNumEntryString(BigInt(nftAmount.amountString).toString());
    setShowAmountEntry(true);
  };

  const onTapMaxButton = () => {
    if (disableNumPad) {
      return;
    }
    if (!currentNFTAmount) {
      return;
    }

    setNumEntryString(nftBalanceString);
  };

  const onSaveAmount = () => {
    if (!currentNFTAmount) {
      return;
    }
    let updated = false;
    const savedNFTAmount = {
      ...currentNFTAmount,
      amountString: BigInt(numEntryString).toString(),
    };
    const newNFTAmounts: NFTAmount[] = [];
    for (const nft of nftAmounts) {
      if (compareNFTs(nft, currentNFTAmount)) {
        updated = true;
        newNFTAmounts.push(savedNFTAmount);
        continue;
      }
      newNFTAmounts.push(nft);
    }
    if (!updated) {
      newNFTAmounts.push(savedNFTAmount);
    }
    setNFTAmounts(newNFTAmounts);
    setShowAmountEntry(false);
  };

  const showErrorDetails = () => {
    setErrorDetailsOpen(true);
  };
  const hideErrorDetails = () => {
    setErrorDetailsOpen(false);
  };

  const showTokenApproveForShielding =
    showAmountEntry &&
    requiresApproval &&
    nftApproved === false &&
    isDefined(currentNFTAmount);

  const showingLoadingNFTApproval = requiresApproval && nftApproved == null;

  return (
    <>
      {showSelectNFTModal && (
        <SelectNFTModal
          onDismiss={onDismissSelectNFTModal}
          isRailgun={isRailgunBalance}
          balanceBucketFilter={balanceBucketFilter}
          selectedNFTAmounts={nftAmounts}
        />
      )}
      <div className={styles.tokenListWrapper}>
        {nftAmounts.map((nftAmount, index) => (
          <NFTAmountRowView
            nftAmount={nftAmount}
            onSelectNFTAmount={() => onSelectNFTAmount(nftAmount)}
            index={index}
            key={nftAmount.nftAddress + nftAmount.tokenSubID}
          />
        ))}
      </div>
      {showAmountEntry && (
        <>
          <div className={styles.addTokenContainer}>
            {currentTokenCanSelectAmount && (
              <div className={styles.amountInputContainer}>
                <Input
                  onChange={e => setNumEntryString(e.target.value)}
                  placeholder="Amount"
                  type="number"
                  value={numEntryString}
                  hasError={numEntryString.length > 0 && !hasValidNumEntry}
                  rightView={
                    <Button
                      children="MAX"
                      onClick={onTapMaxButton}
                      textClassName={styles.bottomButtonLabel}
                      buttonClassName={styles.inputInsetButton}
                    />
                  }
                />
                <Button
                  children={currentNFTMetadata?.name}
                  onClick={onTapNFTSelector}
                  textClassName={styles.bottomButtonLabel}
                  buttonClassName={styles.selectTokenButton}
                  endIcon={thumbnailURL}
                />
              </div>
            )}
            {!currentTokenCanSelectAmount && (
              <SelectedNFTHighlight
                nftAmount={currentNFTAmount}
                onClick={onTapNFTSelector}
              />
            )}
            {nftAmounts.length > 0 && (
              <div className={styles.closeIcon} onClick={onCancelERC1155Amount}>
                {renderIcon(IconType.Close, 18)}
              </div>
            )}
          </div>
          {currentNFTAmount && currentTokenCanSelectAmount && (
            <Text className={styles.tokenBalanceText}>
              {isRailgunBalance ? 'Spendable private' : 'Public'} balance:{' '}
              {nftBalanceString}
            </Text>
          )}
          {isDefined(error) && (
            <Text className={styles.errorAddressText}>
              {error.message}{' '}
              <Text className={styles.errorShowMore} onClick={showErrorDetails}>
                (show more)
              </Text>
            </Text>
          )}
          {!showTokenApproveForShielding && !showingLoadingNFTApproval && (
            <div className={styles.buttonGroup}>
              <Button
                children="Confirm NFT selection"
                disabled={!hasValidNumEntry}
                onClick={onSaveAmount}
                textClassName={styles.bottomButtonLabel}
                buttonClassName={styles.amountActionButton}
              />
            </div>
          )}
          {showTokenApproveForShielding && (
            <ApproveButton
              pendingApproveTransaction={pendingApproveNFTCollectionTransaction}
              textClassName={styles.bottomButtonLabel}
              buttonClassName={styles.approveTokenButton}
              approve={() => {
                if (!openApproveForShielding) {
                  return;
                }
                openApproveForShielding(currentNFTAmount);
              }}
              approveText="Approve NFT for shielding"
              disabled={isDefined(error)}
            />
          )}
          {showingLoadingNFTApproval && (
            <FullScreenSpinner text="Loading NFT details..." />
          )}
        </>
      )}
      {!showAmountEntry && canSendMultipleNFTs && (
        <Button
          endIcon={IconType.Plus}
          children="Add NFT"
          onClick={onTapNFTSelector}
          buttonClassName={styles.newTokenButton}
          textClassName={styles.bottomButtonLabel}
          disabled={showTokenApproveForShielding}
        />
      )}
      {}
      {errorDetailsOpen && isDefined(error) && (
        <ErrorDetailsModal error={error} onDismiss={hideErrorDetails} />
      )}
    </>
  );
};
