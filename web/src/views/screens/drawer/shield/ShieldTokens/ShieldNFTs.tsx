import {
  isDefined,
  NFTAmount,
  NFTAmountRecipient,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  showImmediateToast,
  ToastType,
  TransactionType,
  useAppDispatch,
  useRailgunShieldSpenderContract,
} from '@react-shared';
import { ApproveNFTConfirm } from '@screens/drawer/approve/ApproveNFTConfirm/ApproveNFTConfirm';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { ShieldNFTsConfirm } from './ShieldConfirm/ShieldNFTsConfirm';
import { ShieldNFTsInitial } from './ShieldInitial/ShieldNFTsInitial';

type Props = {
  nftAmount?: NFTAmount;
};

export enum ShieldNFTsView {
  INITIAL = 'INITIAL',
  CONFIRM = 'CONFIRM',
  APPROVE = 'APPROVE',
}

export type ShieldNFTsViewData =
  | ShieldNFTsInitialData
  | ShieldNFTsConfirmData
  | ShieldNFTsApproveData
  | undefined;
export type ShieldNFTsInitialData = {
  nftAmountRecipients: NFTAmountRecipient[];
  approvedNFTAmount?: NFTAmount;
};
export type ShieldNFTsConfirmData = {
  nftAmountRecipients: NFTAmountRecipient[];
};
export type ShieldNFTsApproveData = {
  nftAmountRecipients: NFTAmountRecipient[];
  approveNFTAmount: NFTAmount;
};

export const ShieldNFTs = ({ nftAmount }: Props) => {
  const [view, setView] = useState(ShieldNFTsView.INITIAL);
  const [viewData, setViewData] = useState<ShieldNFTsViewData>(undefined);
  const [authKey, setAuthKey] = useState<Optional<string>>();

  const { shieldApproveSpender, shieldApproveSpenderName } =
    useRailgunShieldSpenderContract();

  const dispatch = useAppDispatch();
  const navigationDataError = (view: ShieldNFTsView) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${view}`,
      }),
    );
  };

  const handleSetView = (view: ShieldNFTsView, data?: ShieldNFTsViewData) => {
    switch (view) {
      case ShieldNFTsView.INITIAL: {
        const viewData = data as ShieldNFTsInitialData;
        if (!isDefined(viewData) || !isDefined(viewData.nftAmountRecipients)) {
          navigationDataError(view);
          return;
        }
        break;
      }
      case ShieldNFTsView.CONFIRM: {
        const viewData = data as ShieldNFTsConfirmData;
        if (!isDefined(viewData) || !isDefined(viewData.nftAmountRecipients)) {
          navigationDataError(view);
          return;
        }
        break;
      }
      case ShieldNFTsView.APPROVE: {
        const viewData = data as ShieldNFTsApproveData;
        if (
          !isDefined(viewData) ||
          !isDefined(viewData.nftAmountRecipients) ||
          !isDefined(viewData.approveNFTAmount)
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
      {view === ShieldNFTsView.INITIAL && (
        <ShieldNFTsInitial
          handleSetView={handleSetView}
          navigationNFTAmount={nftAmount}
          approvedNFTAmount={
            (viewData as ShieldNFTsInitialData)?.approvedNFTAmount
          }
          initialNFTAmountRecipients={
            (viewData as ShieldNFTsInitialData)?.nftAmountRecipients
          }
        />
      )}
      {view === ShieldNFTsView.CONFIRM && viewData && (
        <>
          {isDefined(authKey) && (
            <ShieldNFTsConfirm
              handleSetView={handleSetView}
              nftAmountRecipients={
                (viewData as ShieldNFTsConfirmData).nftAmountRecipients
              }
              authKey={authKey}
            />
          )}
          {!isDefined(authKey) && (
            <EnterPasswordModal
              success={authKey => setAuthKey(authKey)}
              onDismiss={() => {
                handleSetView(ShieldNFTsView.INITIAL, viewData);
              }}
            />
          )}
        </>
      )}
      {view === ShieldNFTsView.APPROVE && viewData && (
        <>
          {isDefined(authKey) && (
            <ApproveNFTConfirm
              goBack={() => {
                handleSetView(ShieldNFTsView.INITIAL, {
                  nftAmountRecipients: (viewData as ShieldNFTsApproveData)
                    .nftAmountRecipients,
                  approveNFTAmount: (viewData as ShieldNFTsApproveData)
                    .approveNFTAmount,
                });
              }}
              backButtonText="Select NFT"
              infoCalloutText={`Approving NFT for shielding: ${shieldApproveSpenderName}.`}
              approveNFTAmount={
                (viewData as ShieldNFTsApproveData).approveNFTAmount
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
                handleSetView(ShieldNFTsView.INITIAL, viewData);
              }}
            />
          )}
        </>
      )}
    </>
  );
};
