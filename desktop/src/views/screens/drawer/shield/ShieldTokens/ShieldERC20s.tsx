import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  ERC20Amount,
  ERC20AmountRecipient,
  ERC20Token,
  showImmediateToast,
  ToastType,
  TransactionType,
  useAppDispatch,
  useRailgunShieldSpenderContract,
} from '@react-shared';
import { ApproveERC20Confirm } from '@screens/drawer/approve/ApproveERC20Confirm/ApproveERC20Confirm';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { ShieldERC20sConfirm } from './ShieldConfirm/ShieldERC20sConfirm';
import { ShieldERC20sInitial } from './ShieldInitial/ShieldERC20sInitial';

type Props = {
  token?: ERC20Token;
};

export enum ShieldERC20sView {
  INITIAL = 'INITIAL',
  CONFIRM = 'CONFIRM',
  APPROVE = 'APPROVE',
}

export type ShieldERC20sViewData =
  | ShieldERC20sInitialData
  | ShieldERC20ConfirmData
  | ShieldERC20ApproveData
  | undefined;
export type ShieldERC20sInitialData = {
  erc20AmountRecipients: ERC20AmountRecipient[];
  approvedToken?: ERC20Token;
  initialRecipientAddress?: string;
};
export type ShieldERC20ConfirmData = {
  erc20AmountRecipients: ERC20AmountRecipient[];
};
export type ShieldERC20ApproveData = {
  erc20AmountRecipients: ERC20AmountRecipient[];
  approveERC20Amount: ERC20Amount;
  recipientAddress: string;
};

export const ShieldERC20s = ({ token }: Props) => {
  const [view, setView] = useState(ShieldERC20sView.INITIAL);
  const [viewData, setViewData] = useState<ShieldERC20sViewData>(undefined);
  const [authKey, setAuthKey] = useState<Optional<string>>();

  const { shieldApproveSpender, shieldApproveSpenderName } =
    useRailgunShieldSpenderContract();

  const dispatch = useAppDispatch();
  const navigationDataError = (view: ShieldERC20sView) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${view}`,
      }),
    );
  };

  const handleSetView = (
    view: ShieldERC20sView,
    data?: ShieldERC20sViewData,
  ) => {
    switch (view) {
      case ShieldERC20sView.INITIAL: {
        const viewData = data as ShieldERC20sInitialData;
        if (
          !isDefined(viewData) ||
          !isDefined(viewData.erc20AmountRecipients)
        ) {
          navigationDataError(view);
          return;
        }
        break;
      }
      case ShieldERC20sView.CONFIRM: {
        const viewData = data as ShieldERC20ConfirmData;
        if (
          !isDefined(viewData) ||
          !isDefined(viewData.erc20AmountRecipients)
        ) {
          navigationDataError(view);
          return;
        }
        break;
      }
      case ShieldERC20sView.APPROVE: {
        const viewData = data as ShieldERC20ApproveData;
        if (
          !isDefined(viewData) ||
          !isDefined(viewData.erc20AmountRecipients) ||
          !isDefined(viewData.approveERC20Amount)
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
      {view === ShieldERC20sView.INITIAL && (
        <ShieldERC20sInitial
          handleSetView={handleSetView}
          navigationToken={token}
          initialRecipientAddress={
            (viewData as ShieldERC20sInitialData)?.initialRecipientAddress
          }
          initialERC20AmountRecipients={
            (viewData as ShieldERC20sInitialData)?.erc20AmountRecipients
          }
          approvedToken={(viewData as ShieldERC20sInitialData)?.approvedToken}
        />
      )}
      {view === ShieldERC20sView.CONFIRM && viewData && (
        <>
          {isDefined(authKey) && (
            <ShieldERC20sConfirm
              handleSetView={handleSetView}
              erc20AmountRecipients={
                (viewData as ShieldERC20ConfirmData).erc20AmountRecipients
              }
              authKey={authKey}
            />
          )}
          {!isDefined(authKey) && (
            <EnterPasswordModal
              success={authKey => setAuthKey(authKey)}
              onDismiss={() => {
                handleSetView(ShieldERC20sView.INITIAL, viewData);
              }}
            />
          )}
        </>
      )}
      {view === ShieldERC20sView.APPROVE && viewData && (
        <>
          {isDefined(authKey) && (
            <ApproveERC20Confirm
              goBack={() => {
                handleSetView(ShieldERC20sView.INITIAL, {
                  initialRecipientAddress: (viewData as ShieldERC20ApproveData)
                    .recipientAddress,
                  erc20AmountRecipients: (viewData as ShieldERC20ApproveData)
                    .erc20AmountRecipients,
                  approveERC20Amount: (viewData as ShieldERC20ApproveData)
                    .approveERC20Amount,
                });
              }}
              backButtonText="Select token"
              infoCalloutText={`Approving token for shielding: ${shieldApproveSpenderName}.`}
              approveERC20Amount={
                (viewData as ShieldERC20ApproveData).approveERC20Amount
              }
              spender={shieldApproveSpender}
              spenderName={shieldApproveSpenderName}
              authKey={authKey}
              transactionType={TransactionType.ApproveShield}
            />
          )}
          {!isDefined(authKey) && (
            <EnterPasswordModal
              success={authKey => setAuthKey(authKey)}
              onDismiss={() => {
                handleSetView(ShieldERC20sView.INITIAL, viewData);
              }}
            />
          )}
        </>
      )}
    </>
  );
};
