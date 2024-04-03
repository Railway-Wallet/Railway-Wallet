import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  ERC20AmountRecipient,
  ERC20Token,
  showImmediateToast,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { UnshieldERC20sConfirm } from './UnshieldConfirm/UnshieldERC20sConfirm';
import { UnshieldERC20sInitial } from './UnshieldInitial/UnshieldERC20sInitial';

type Props = {
  token?: ERC20Token;
  setHasValidProof: (hasProof: boolean) => void;
};

export enum UnshieldERC20sView {
  INITIAL = 'INITIAL',
  CONFIRM = 'CONFIRM',
}

export type UnshieldERC20sViewData =
  | UnshieldERC20sInitialData
  | UnshieldERC20sConfirmData
  | undefined;
export type UnshieldERC20sInitialData = {
  erc20AmountRecipients: ERC20AmountRecipient[];
};
export type UnshieldERC20sConfirmData = {
  erc20AmountRecipients: ERC20AmountRecipient[];
  isBaseTokenUnshield: boolean;
};

export const UnshieldERC20s = ({ token, setHasValidProof }: Props) => {
  const [view, setView] = useState(UnshieldERC20sView.INITIAL);
  const [viewData, setViewData] = useState<UnshieldERC20sViewData>(undefined);
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [balanceBucketFilter, setBalanceBucketFilter] = useState<
    RailgunWalletBalanceBucket[]
  >([RailgunWalletBalanceBucket.Spendable]);

  const dispatch = useAppDispatch();
  const navigationDataError = (view: UnshieldERC20sView) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${view}`,
      }),
    );
  };

  const handleSetView = (
    view: UnshieldERC20sView,
    data?: UnshieldERC20sViewData,
  ) => {
    switch (view) {
      case UnshieldERC20sView.INITIAL: {
        const viewData = data as UnshieldERC20sInitialData;
        if (
          !isDefined(viewData) ||
          !isDefined(viewData.erc20AmountRecipients)
        ) {
          navigationDataError(view);
          return;
        }
        break;
      }
      case UnshieldERC20sView.CONFIRM: {
        const viewData = data as UnshieldERC20sConfirmData;
        if (
          !isDefined(viewData) ||
          !isDefined(viewData.erc20AmountRecipients) ||
          !isDefined(viewData.isBaseTokenUnshield)
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
      {view === UnshieldERC20sView.INITIAL && (
        <UnshieldERC20sInitial
          handleSetView={handleSetView}
          navigationToken={token}
          initialERC20AmountRecipients={
            (viewData as UnshieldERC20sInitialData)?.erc20AmountRecipients
          }
        />
      )}
      {view === UnshieldERC20sView.CONFIRM && viewData && (
        <>
          {isDefined(authKey) && (
            <UnshieldERC20sConfirm
              handleSetView={handleSetView}
              erc20AmountRecipients={
                (viewData as UnshieldERC20sConfirmData).erc20AmountRecipients
              }
              setHasValidProof={setHasValidProof}
              authKey={authKey}
              isBaseTokenUnshield={
                (viewData as UnshieldERC20sConfirmData).isBaseTokenUnshield
              }
              balanceBucketFilter={balanceBucketFilter}
            />
          )}
          {!isDefined(authKey) && (
            <EnterPasswordModal
              success={authKey => setAuthKey(authKey)}
              onDismiss={() => {
                handleSetView(UnshieldERC20sView.INITIAL, viewData);
              }}
            />
          )}
        </>
      )}
    </>
  );
};
