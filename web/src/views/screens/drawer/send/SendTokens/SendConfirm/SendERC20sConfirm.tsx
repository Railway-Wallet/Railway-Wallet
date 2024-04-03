import { NFTAmountRecipient } from '@railgun-community/shared-models';
import { useRef } from 'react';
import { ERC20AmountRecipient } from '@react-shared';
import { SendERC20sView, SendERC20sViewData } from '../SendERC20s';
import { SendConfirm } from './SendConfirm';

type Props = {
  handleSetView: (view: SendERC20sView, data: SendERC20sViewData) => void;
  isRailgun: boolean;
  erc20AmountRecipients: ERC20AmountRecipient[];
  authKey: string;
};

export const SendERC20sConfirm = ({
  handleSetView,
  isRailgun,
  erc20AmountRecipients,
  authKey,
}: Props) => {
  const goBack = () => {
    handleSetView(SendERC20sView.INITIAL, { erc20AmountRecipients });
  };

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  return (
    <SendConfirm
      goBack={goBack}
      isRailgun={isRailgun}
      erc20AmountRecipients={erc20AmountRecipients}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      authKey={authKey}
    />
  );
};
