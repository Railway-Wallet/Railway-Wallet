import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import { EVENT_CLOSE_DRAWER, FxMintCloseData } from '@models/drawer-types';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { FxMintCloseConfirm } from '../FxMintCloseConfirm/FxMintCloseConfirm';

type Props = FxMintCloseData;

export const FxMintCloseFlow = (props: Props) => {
  const [authKey, setAuthKey] = useState<Optional<string>>();

  return (
    <>
      {isDefined(authKey) && <FxMintCloseConfirm authKey={authKey} {...props} />}
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
