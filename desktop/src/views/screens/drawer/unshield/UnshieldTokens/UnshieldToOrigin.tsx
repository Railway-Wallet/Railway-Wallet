import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import { logDevError } from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { UnshieldToOriginData } from '../../../../../models/drawer-types';
import { UnshieldConfirm } from './UnshieldConfirm/UnshieldConfirm';

type Props = {
  unshieldToOriginData: UnshieldToOriginData;
  setHasValidProof: (hasProof: boolean) => void;
  closeDrawer: () => void;
};

export const UnshieldToOrigin = ({
  unshieldToOriginData,
  setHasValidProof,
  closeDrawer,
}: Props) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [balanceBucketFilter, setBalanceBucketFilter] = useState<
    RailgunWalletBalanceBucket[]
  >([RailgunWalletBalanceBucket.Spendable]);

  if (!unshieldToOriginData.originalShieldTxid) {
    logDevError('originalShieldTxid required for UnshieldToOrigin');
    return null;
  }

  return (
    <>
      <>
        {isDefined(authKey) && (
          <UnshieldConfirm
            goBack={closeDrawer}
            erc20AmountRecipients={unshieldToOriginData.erc20AmountRecipients}
            nftAmountRecipients={unshieldToOriginData.nftAmountRecipients}
            authKey={authKey}
            setHasValidProof={setHasValidProof}
            isBaseTokenUnshield={false}
            balanceBucketFilter={balanceBucketFilter}
            unshieldToOriginShieldTxid={unshieldToOriginData.originalShieldTxid}
          />
        )}
        {!isDefined(authKey) && (
          <EnterPasswordModal
            success={authKey => setAuthKey(authKey)}
            onDismiss={closeDrawer}
          />
        )}
      </>
    </>
  );
};
