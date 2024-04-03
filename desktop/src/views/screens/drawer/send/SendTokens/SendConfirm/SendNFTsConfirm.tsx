import { NFTAmountRecipient } from '@railgun-community/shared-models';
import { useRef } from 'react';
import { ERC20AmountRecipient } from '@react-shared';
import { SendNFTsView, SendNFTsViewData } from '../SendNFTs';
import { SendConfirm } from './SendConfirm';

type Props = {
  handleSetView: (view: SendNFTsView, data: SendNFTsViewData) => void;
  isRailgun: boolean;
  nftAmountRecipients: NFTAmountRecipient[];
  authKey: string;
};

export const SendNFTsConfirm = ({
  handleSetView,
  isRailgun,
  nftAmountRecipients,
  authKey,
}: Props) => {
  const goBack = () => {
    handleSetView(SendNFTsView.INITIAL, { nftAmountRecipients });
  };

  const erc20AmountRecipientsRef = useRef<ERC20AmountRecipient[]>([]);

  return (
    <SendConfirm
      goBack={goBack}
      isRailgun={isRailgun}
      erc20AmountRecipients={erc20AmountRecipientsRef.current}
      nftAmountRecipients={nftAmountRecipients}
      authKey={authKey}
    />
  );
};
