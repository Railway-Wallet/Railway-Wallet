import {
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useRef } from 'react';
import { ERC20AmountRecipient } from '@react-shared';
import { UnshieldERC20sView, UnshieldERC20sViewData } from '../UnshieldERC20s';
import { UnshieldConfirm } from './UnshieldConfirm';

type Props = {
  handleSetView: (
    view: UnshieldERC20sView,
    data: UnshieldERC20sViewData,
  ) => void;
  erc20AmountRecipients: ERC20AmountRecipient[];
  authKey: string;
  setHasValidProof: (hasProof: boolean) => void;
  isBaseTokenUnshield: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const UnshieldERC20sConfirm = ({
  handleSetView,
  erc20AmountRecipients,
  authKey,
  setHasValidProof,
  isBaseTokenUnshield,
  balanceBucketFilter,
}: Props) => {
  const goBack = () => {
    handleSetView(UnshieldERC20sView.INITIAL, { erc20AmountRecipients });
  };

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  return (
    <UnshieldConfirm
      goBack={goBack}
      erc20AmountRecipients={erc20AmountRecipients}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      authKey={authKey}
      setHasValidProof={setHasValidProof}
      isBaseTokenUnshield={isBaseTokenUnshield}
      balanceBucketFilter={balanceBucketFilter}
    />
  );
};
