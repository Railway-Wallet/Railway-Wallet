import { NFTAmountRecipient } from '@railgun-community/shared-models';
import { useRef } from 'react';
import { ERC20AmountRecipient } from '@react-shared';
import { ShieldNFTsView, ShieldNFTsViewData } from '../ShieldNFTs';
import { ShieldConfirm } from './ShieldConfirm';

type Props = {
  handleSetView: (view: ShieldNFTsView, data: ShieldNFTsViewData) => void;
  nftAmountRecipients: NFTAmountRecipient[];
  authKey: string;
};

export const ShieldNFTsConfirm = ({
  handleSetView,
  nftAmountRecipients,
  authKey,
}: Props) => {
  const goBack = () => {
    handleSetView(ShieldNFTsView.INITIAL, { nftAmountRecipients });
  };

  const erc20AmountRecipientsRef = useRef<ERC20AmountRecipient[]>([]);

  return (
    <ShieldConfirm
      goBack={goBack}
      erc20AmountRecipients={erc20AmountRecipientsRef.current}
      nftAmountRecipients={nftAmountRecipients}
      authKey={authKey}
    />
  );
};
