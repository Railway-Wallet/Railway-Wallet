import {
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useRef } from 'react';
import { ERC20AmountRecipient } from '@react-shared';
import { UnshieldNFTsView, UnshieldNFTsViewData } from '../UnshieldNFTs';
import { UnshieldConfirm } from './UnshieldConfirm';

type Props = {
  handleSetView: (view: UnshieldNFTsView, data: UnshieldNFTsViewData) => void;
  nftAmountRecipients: NFTAmountRecipient[];
  setHasValidProof: (hasProof: boolean) => void;
  authKey: string;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const UnshieldNFTsConfirm = ({
  handleSetView,
  nftAmountRecipients,
  setHasValidProof,
  authKey,
  balanceBucketFilter,
}: Props) => {
  const goBack = () => {
    handleSetView(UnshieldNFTsView.INITIAL, { nftAmountRecipients });
  };

  const erc20AmountRecipientsRef = useRef<ERC20AmountRecipient[]>([]);

  return (
    <UnshieldConfirm
      goBack={goBack}
      erc20AmountRecipients={erc20AmountRecipientsRef.current}
      nftAmountRecipients={nftAmountRecipients}
      authKey={authKey}
      setHasValidProof={setHasValidProof}
      isBaseTokenUnshield={false}
      balanceBucketFilter={balanceBucketFilter}
    />
  );
};
