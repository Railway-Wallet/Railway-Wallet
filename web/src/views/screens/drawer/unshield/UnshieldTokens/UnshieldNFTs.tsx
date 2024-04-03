import {
  isDefined,
  NFTAmount,
  NFTAmountRecipient,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import { showImmediateToast, ToastType, useAppDispatch } from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { UnshieldNFTsConfirm } from './UnshieldConfirm/UnshieldNFTsConfirm';
import { UnshieldNFTsInitial } from './UnshieldInitial/UnshieldNFTsInitial';

type Props = {
  nftAmount?: NFTAmount;
  setHasValidProof: (hasProof: boolean) => void;
};

export enum UnshieldNFTsView {
  INITIAL = 'INITIAL',
  CONFIRM = 'CONFIRM',
}

export type UnshieldNFTsViewData =
  | UnshieldNFTsInitialData
  | UnshieldNFTsConfirmData
  | undefined;
export type UnshieldNFTsInitialData = {
  nftAmountRecipients: NFTAmountRecipient[];
};
export type UnshieldNFTsConfirmData = {
  nftAmountRecipients: NFTAmountRecipient[];
};

export const UnshieldNFTs = ({ nftAmount, setHasValidProof }: Props) => {
  const [view, setView] = useState(UnshieldNFTsView.INITIAL);
  const [viewData, setViewData] = useState<UnshieldNFTsViewData>(undefined);
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [balanceBucketFilter, setBalanceBucketFilter] = useState<
    RailgunWalletBalanceBucket[]
  >([RailgunWalletBalanceBucket.Spendable]);

  const dispatch = useAppDispatch();
  const navigationDataError = (view: UnshieldNFTsView) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${view}`,
      }),
    );
  };

  const handleSetView = (
    view: UnshieldNFTsView,
    data?: UnshieldNFTsViewData,
  ) => {
    switch (view) {
      case UnshieldNFTsView.INITIAL: {
        const viewData = data as UnshieldNFTsInitialData;
        if (!isDefined(viewData) || !isDefined(viewData.nftAmountRecipients)) {
          navigationDataError(view);
          return;
        }
        break;
      }
      case UnshieldNFTsView.CONFIRM: {
        const viewData = data as UnshieldNFTsConfirmData;
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
      {view === UnshieldNFTsView.INITIAL && (
        <UnshieldNFTsInitial
          handleSetView={handleSetView}
          navigationNFTAmount={nftAmount}
          initialNFTAmountRecipients={
            (viewData as UnshieldNFTsInitialData)?.nftAmountRecipients
          }
        />
      )}
      {view === UnshieldNFTsView.CONFIRM && viewData && (
        <>
          {isDefined(authKey) && (
            <UnshieldNFTsConfirm
              handleSetView={handleSetView}
              nftAmountRecipients={
                (viewData as UnshieldNFTsConfirmData).nftAmountRecipients
              }
              setHasValidProof={setHasValidProof}
              authKey={authKey}
              balanceBucketFilter={balanceBucketFilter}
            />
          )}
          {!isDefined(authKey) && (
            <EnterPasswordModal
              success={authKey => setAuthKey(authKey)}
              onDismiss={() => {
                handleSetView(UnshieldNFTsView.INITIAL, viewData);
              }}
            />
          )}
        </>
      )}
    </>
  );
};
