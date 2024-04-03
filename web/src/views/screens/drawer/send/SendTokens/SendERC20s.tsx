import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  ERC20AmountRecipient,
  ERC20Token,
  showImmediateToast,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { SendERC20sConfirm } from './SendConfirm/SendERC20sConfirm';
import { SendERC20sInitial } from './SendInitial/SendERC20sInitial';

type Props = {
  token?: ERC20Token;
  isRailgun: boolean;
};

export enum SendERC20sView {
  INITIAL = 'INITIAL',
  CONFIRM = 'CONFIRM',
}

export type SendERC20sViewData =
  | SendERC20sInitialData
  | SendERC20sConfirmData
  | undefined;
export type SendERC20sInitialData = {
  erc20AmountRecipients: ERC20AmountRecipient[];
};
export type SendERC20sConfirmData = {
  erc20AmountRecipients: ERC20AmountRecipient[];
};

export const SendERC20s = ({ token, isRailgun }: Props) => {
  const [view, setView] = useState(SendERC20sView.INITIAL);
  const [viewData, setViewData] = useState<SendERC20sViewData>(undefined);
  const [authKey, setAuthKey] = useState<Optional<string>>();

  const dispatch = useAppDispatch();
  const navigationDataError = (view: SendERC20sView) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${view}`,
      }),
    );
  };

  const handleSetView = (view: SendERC20sView, data?: SendERC20sViewData) => {
    switch (view) {
      case SendERC20sView.INITIAL: {
        const viewData = data as SendERC20sInitialData;
        if (
          !isDefined(viewData) ||
          !isDefined(viewData.erc20AmountRecipients)
        ) {
          navigationDataError(view);
          return;
        }
        break;
      }
      case SendERC20sView.CONFIRM: {
        const viewData = data as SendERC20sConfirmData;
        if (
          !isDefined(viewData) ||
          !isDefined(viewData.erc20AmountRecipients)
        ) {
          navigationDataError(view);
          return;
        }
        break;
      }
    }
    setView(view);
    setViewData(data);
  };

  return (
    <>
      {view === SendERC20sView.INITIAL && (
        <SendERC20sInitial
          handleSetView={handleSetView}
          navigationToken={token}
          isRailgun={isRailgun}
          initialERC20AmountRecipients={
            (viewData as SendERC20sInitialData)?.erc20AmountRecipients
          }
        />
      )}
      {view === SendERC20sView.CONFIRM && viewData && (
        <>
          {isDefined(authKey) && (
            <SendERC20sConfirm
              handleSetView={handleSetView}
              isRailgun={isRailgun}
              erc20AmountRecipients={
                (viewData as SendERC20sConfirmData).erc20AmountRecipients
              }
              authKey={authKey}
            />
          )}
          {!isDefined(authKey) && (
            <EnterPasswordModal
              success={authKey => setAuthKey(authKey)}
              onDismiss={() => {
                handleSetView(SendERC20sView.INITIAL, viewData);
              }}
            />
          )}
        </>
      )}
    </>
  );
};
