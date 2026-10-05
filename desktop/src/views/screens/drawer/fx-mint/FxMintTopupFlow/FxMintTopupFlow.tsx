import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { EVENT_CLOSE_DRAWER, FxMintTopupData } from '@models/drawer-types';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { FxMintTopupConfirm } from '../FxMintTopupConfirm/FxMintTopupConfirm';

type Props = FxMintTopupData;

export const FxMintTopupFlow = (props: Props) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();

  return (
    <>
      {isDefined(authKey) && <FxMintTopupConfirm authKey={authKey} {...props} />}
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
