import { NFTAmountRecipient } from '@railgun-community/shared-models';
import { useRef } from 'react';
import { ERC20AmountRecipient } from '@react-shared';
import { ShieldERC20sView, ShieldERC20sViewData } from '../ShieldERC20s';
import { ShieldConfirm } from './ShieldConfirm';

type Props = {
  handleSetView: (view: ShieldERC20sView, data: ShieldERC20sViewData) => void;
  erc20AmountRecipients: ERC20AmountRecipient[];
  authKey: string;
};

export const ShieldERC20sConfirm = ({
  handleSetView,
  erc20AmountRecipients,
  authKey,
}: Props) => {
  const goBack = () => {
    handleSetView(ShieldERC20sView.INITIAL, { erc20AmountRecipients });
  };

  const nftAmountRecipientsRef = useRef<NFTAmountRecipient[]>([]);

  return (
    <ShieldConfirm
      goBack={goBack}
      erc20AmountRecipients={erc20AmountRecipients}
      nftAmountRecipients={nftAmountRecipientsRef.current}
      authKey={authKey}
    />
  );
};
