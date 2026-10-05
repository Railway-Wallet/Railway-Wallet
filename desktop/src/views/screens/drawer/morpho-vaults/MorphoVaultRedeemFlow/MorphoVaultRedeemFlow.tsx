import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  EVENT_CLOSE_DRAWER,
  MorphoVaultRedeemData,
} from '@models/drawer-types';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { MorphoVaultRedeemConfirm } from '../MorphoVaultRedeemConfirm/MorphoVaultRedeemConfirm';

type Props = MorphoVaultRedeemData;

export const MorphoVaultRedeemFlow = (props: Props) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();

  return (
    <>
      {isDefined(authKey) && (
        <MorphoVaultRedeemConfirm authKey={authKey} {...props} />
      )}
      {!isDefined(authKey) && (
        <EnterPasswordModal
          success={key => setAuthKey(key)}
          onDismiss={() => {
            drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
          }}
        />
      )}
    </>
  );
};
