import {
  isDefined,
  NFTAmount,
  NFTAmountRecipient,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import { showImmediateToast, ToastType, useAppDispatch } from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { SendNFTsConfirm } from './SendConfirm/SendNFTsConfirm';
import { SendNFTsInitial } from './SendInitial/SendNFTsInitial';

type Props = {
  nftAmount?: NFTAmount;
  isRailgun: boolean;
};

export enum SendNFTsView {
  INITIAL = 'INITIAL',
  CONFIRM = 'CONFIRM',
}

export type SendNFTsViewData =
  | SendNFTsInitialData
  | SendNFTsConfirmData
  | undefined;
export type SendNFTsInitialData = {
  nftAmountRecipients: NFTAmountRecipient[];
};
export type SendNFTsConfirmData = {
  nftAmountRecipients: NFTAmountRecipient[];
};

export const SendNFTs = ({ nftAmount, isRailgun }: Props) => {
  const [view, setView] = useState(SendNFTsView.INITIAL);
  const [viewData, setViewData] = useState<SendNFTsViewData>(undefined);
  const [authKey, setAuthKey] = useState<Optional<string>>();

  const dispatch = useAppDispatch();
  const navigationDataError = (view: SendNFTsView) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${view}`,
      }),
    );
  };

  const handleSetView = (view: SendNFTsView, data?: SendNFTsViewData) => {
    switch (view) {
      case SendNFTsView.INITIAL: {
        const viewData = data as SendNFTsInitialData;
        if (!isDefined(viewData) || !isDefined(viewData.nftAmountRecipients)) {
          navigationDataError(view);
          return;
        }
        break;
      }
      case SendNFTsView.CONFIRM: {
        const viewData = data as SendNFTsConfirmData;
        if (!isDefined(viewData) || !isDefined(viewData.nftAmountRecipients)) {
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
      {view === SendNFTsView.INITIAL && (
        <SendNFTsInitial
          handleSetView={handleSetView}
          navigationNFTAmount={nftAmount}
          isRailgun={isRailgun}
          initialNFTAmountRecipients={
            (viewData as SendNFTsInitialData)?.nftAmountRecipients
          }
        />
      )}
      {view === SendNFTsView.CONFIRM && viewData && (
        <>
          {isDefined(authKey) && (
            <SendNFTsConfirm
              handleSetView={handleSetView}
              isRailgun={isRailgun}
              nftAmountRecipients={
                (viewData as SendNFTsConfirmData).nftAmountRecipients
              }
              authKey={authKey}
            />
          )}
          {!isDefined(authKey) && (
            <EnterPasswordModal
              success={authKey => setAuthKey(authKey)}
              onDismiss={() => {
                handleSetView(SendNFTsView.INITIAL, viewData);
              }}
            />
          )}
        </>
      )}
    </>
  );
};
