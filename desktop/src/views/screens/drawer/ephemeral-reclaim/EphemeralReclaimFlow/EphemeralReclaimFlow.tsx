import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { EphemeralReclaimData, EVENT_CLOSE_DRAWER } from '@models/drawer-types';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { EphemeralReclaimConfirm } from '../EphemeralReclaimConfirm/EphemeralReclaimConfirm';

type Props = EphemeralReclaimData;

export const EphemeralReclaimFlow = (props: Props) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();

  return (
    <>
      {isDefined(authKey) && (
        <EphemeralReclaimConfirm authKey={authKey} {...props} />
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
