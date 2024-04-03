import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { ERC20Amount, Vault } from '@react-shared';
import {
  EVENT_CLOSE_DRAWER,
  SwapPrivateData,
} from '../../../../../models/drawer-types';
import { drawerEventsBus } from '../../../../../services/navigation/drawer-events';
import { EnterPasswordModal } from '../../../modals/EnterPasswordModal/EnterPasswordModal';
import { SwapPrivateConfirm } from '../SwapPrivateConfirm/SwapPrivateConfirm';

type Props = SwapPrivateData;

export enum SwapPrivateView {
  CONFIRM = 'CONFIRM',
}

export type SwapPrivateConfirmData = {
  selectedVault: Vault;
  selectedTokenAmount: ERC20Amount;
};

export type SwapPrivateViewData = SwapPrivateConfirmData | undefined;

export const SwapPrivateFlow = (props: Props) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();

  const getSwapPrivateView = () => {
    return (
      <>
        {isDefined(authKey) && (
          <SwapPrivateConfirm authKey={authKey} {...props} />
        )}
        {!isDefined(authKey) && (
          <EnterPasswordModal
            success={authKey => setAuthKey(authKey)}
            onDismiss={() => {
              drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
            }}
          />
        )}
      </>
    );
  };

  return <>{getSwapPrivateView()}</>;
};
