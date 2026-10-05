import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  EVENT_CLOSE_DRAWER,
  MorphoVaultDepositData,
} from '@models/drawer-types';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { MorphoVaultDepositConfirm } from '../MorphoVaultDepositConfirm/MorphoVaultDepositConfirm';

type Props = MorphoVaultDepositData;

export const MorphoVaultDepositFlow = (props: Props) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();

  return (
    <>
      {isDefined(authKey) && (
        <MorphoVaultDepositConfirm authKey={authKey} {...props} />
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
