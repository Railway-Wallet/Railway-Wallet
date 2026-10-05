import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { EVENT_CLOSE_DRAWER, FxMintOpenData } from '@models/drawer-types';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { FxMintOpenConfirm } from '../FxMintOpenConfirm/FxMintOpenConfirm';

type Props = FxMintOpenData;

export const FxMintOpenFlow = (props: Props) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();

  return (
    <>
      {isDefined(authKey) && <FxMintOpenConfirm authKey={authKey} {...props} />}
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
