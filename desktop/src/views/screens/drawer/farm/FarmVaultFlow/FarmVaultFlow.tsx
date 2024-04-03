import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  CookbookFarmRecipeType,
  ERC20Amount,
  ERC20Token,
  showImmediateToast,
  ToastType,
  useAppDispatch,
  Vault,
} from '@react-shared';
import { EnterPasswordModal } from '../../../modals/EnterPasswordModal/EnterPasswordModal';
import { FarmVaultConfirm } from '../FarmVaultConfirm/FarmVaultConfirm';
import { FarmVaultInitial } from '../FarmVaultInitial/FarmVaultInitial';

type Props = {
  token: ERC20Token;
  cookbookFarmRecipeType: CookbookFarmRecipeType;
};

export enum FarmVaultView {
  INITIAL = 'INITIAL',
  CONFIRM = 'CONFIRM',
}

export type FarmVaultConfirmData = {
  selectedVault: Vault;
  selectedTokenAmount: ERC20Amount;
};

export type FarmVaultViewData = FarmVaultConfirmData | undefined;

export const FarmVaultFlow = ({ token, cookbookFarmRecipeType }: Props) => {
  const [view, setView] = useState(FarmVaultView.INITIAL);
  const [viewData, setViewData] = useState<FarmVaultViewData>(undefined);

  const [authKey, setAuthKey] = useState<Optional<string>>();

  const dispatch = useAppDispatch();

  const navigationDataError = (view: FarmVaultView) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${view}`,
      }),
    );
  };

  const handleSetView = (view: FarmVaultView, data?: FarmVaultViewData) => {
    if (!data) {
      navigationDataError(view);
      return;
    }
    setView(view);
    setViewData(data);
  };

  const getFarmView = () => {
    if (view === FarmVaultView.INITIAL) {
      return (
        <FarmVaultInitial
          currentToken={token}
          handleSetView={handleSetView}
          cookbookFarmRecipeType={cookbookFarmRecipeType}
          initialVault={viewData?.selectedVault}
          initialTokenAmount={viewData?.selectedTokenAmount}
        />
      );
    }
    if (view === FarmVaultView.CONFIRM && viewData) {
      return (
        <>
          {isDefined(authKey) && (
            <FarmVaultConfirm
              authKey={authKey}
              cookbookFarmRecipeType={cookbookFarmRecipeType}
              selectedTokenAmount={viewData.selectedTokenAmount}
              selectedVault={viewData.selectedVault}
              handleSetView={handleSetView}
            />
          )}
          {!isDefined(authKey) && (
            <EnterPasswordModal
              success={authKey => setAuthKey(authKey)}
              onDismiss={() => {
                handleSetView(FarmVaultView.INITIAL, viewData);
              }}
            />
          )}
        </>
      );
    }
    return null;
  };

  return <>{getFarmView()}</>;
};
