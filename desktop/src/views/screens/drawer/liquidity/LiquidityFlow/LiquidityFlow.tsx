import { LiquidityV2Pool } from '@railgun-community/cookbook';
import { isDefined } from '@railgun-community/shared-models';
import { useState } from 'react';
import {
  CookbookLiquidityRecipeType,
  ERC20Amount,
  FrontendLiquidityPair,
  showImmediateToast,
  ToastType,
  useAppDispatch,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { AddLiquidityConfirm } from '../AddLiquidityConfirm/AddLiquidityConfirm';
import { AddLiquidityInitial } from '../AddLiquidityInitial/AddLiquidityInitial';
import { RemoveLiquidityConfirm } from '../RemoveLiquidityConfirm/RemoveLiquidityConfirm';
import { RemoveLiquidityInitial } from '../RemoveLiquidityInitial/RemoveLiquidityInitial';

export enum LiquidityView {
  ADD_INITIAL = 'ADD_LIQUIDITY_INITIAL',
  ADD_CONFIRM = 'ADD_LIQUIDITY_CONFIRM',
  REMOVE_INITIAL = 'REMOVE_LIQUIDITY_INITIAL',
  REMOVE_CONFIRM = 'REMOVE_LIQUIDITY_CONFIRM',
}

type Props = {
  pool?: FrontendLiquidityPair;
  tokenAddress?: string;
  cookbookLiquidityRecipeType: CookbookLiquidityRecipeType;
};

export type AddLiquidityConfirmData = {
  selectedPool: LiquidityV2Pool;
  tokenAmountA: ERC20Amount;
  tokenAmountB: ERC20Amount;
  slippagePercentage: number;
};

export type RemoveLiquidityConfirmData = {
  tokenAmount: ERC20Amount;
  liquidityPool: LiquidityV2Pool;
  slippagePercentage: number;
};

export type LiquidityViewData =
  | AddLiquidityConfirmData
  | RemoveLiquidityConfirmData
  | undefined;

export const LiquidityFlow = ({
  pool,
  cookbookLiquidityRecipeType,
  tokenAddress,
}: Props) => {
  const getInitialView = () => {
    switch (cookbookLiquidityRecipeType) {
      case CookbookLiquidityRecipeType.AddLiquidity:
        return LiquidityView.ADD_INITIAL;
      case CookbookLiquidityRecipeType.RemoveLiquidity:
        return LiquidityView.REMOVE_INITIAL;
    }
  };

  const dispatch = useAppDispatch();
  const [view, setView] = useState(getInitialView());
  const [authKey, setAuthKey] = useState<Optional<string>>();
  const [viewData, setViewData] = useState<LiquidityViewData>(undefined);

  const navigationDataError = (view: LiquidityView) => {
    dispatch(
      showImmediateToast({
        type: ToastType.Error,
        message: `Incorrect data type for ${view}`,
      }),
    );
  };

  const handleSetView = (view: LiquidityView, data?: LiquidityViewData) => {
    if (!isDefined(data)) {
      navigationDataError(view);
      return;
    }
    setView(view);
    setViewData(data);
  };

  const getLiquidityView = () => {
    if (view === LiquidityView.ADD_INITIAL && isDefined(pool)) {
      const initialData = viewData as AddLiquidityConfirmData;
      return (
        <AddLiquidityInitial
          pool={pool}
          handleSetView={handleSetView}
          initialTokenAmount={initialData?.tokenAmountA}
          cookbookLiquidityRecipeType={cookbookLiquidityRecipeType}
        />
      );
    }

    if (view === LiquidityView.REMOVE_INITIAL && isDefined(tokenAddress)) {
      const initialData = viewData as RemoveLiquidityConfirmData;
      return (
        <RemoveLiquidityInitial
          tokenAddress={tokenAddress}
          initialTokenAmount={initialData?.tokenAmount}
          handleSetView={handleSetView}
          cookbookLiquidityRecipeType={cookbookLiquidityRecipeType}
        />
      );
    }

    if (isDefined(viewData)) {
      if (view === LiquidityView.ADD_CONFIRM) {
        const confirmData = viewData as AddLiquidityConfirmData;
        return (
          <>
            {isDefined(authKey) && (
              <AddLiquidityConfirm
                authKey={authKey}
                handleSetView={handleSetView}
                selectedPool={confirmData?.selectedPool}
                tokenAmountA={confirmData?.tokenAmountA}
                tokenAmountB={confirmData?.tokenAmountB}
                initialSlippagePercent={confirmData?.slippagePercentage}
              />
            )}
            {!isDefined(authKey) && (
              <EnterPasswordModal
                success={authKey => setAuthKey(authKey)}
                onDismiss={() => {
                  handleSetView(LiquidityView.ADD_INITIAL, viewData);
                }}
              />
            )}
          </>
        );
      }

      if (view === LiquidityView.REMOVE_CONFIRM) {
        const confirmData = viewData as RemoveLiquidityConfirmData;
        return (
          <>
            {isDefined(authKey) && (
              <RemoveLiquidityConfirm
                authKey={authKey}
                handleSetView={handleSetView}
                tokenAmount={confirmData?.tokenAmount}
                liquidityPool={confirmData?.liquidityPool}
                initialSlippagePercent={confirmData?.slippagePercentage}
              />
            )}
            {!isDefined(authKey) && (
              <EnterPasswordModal
                success={authKey => setAuthKey(authKey)}
                onDismiss={() => {
                  handleSetView(LiquidityView.REMOVE_INITIAL, viewData);
                }}
              />
            )}
          </>
        );
      }
    }

    return null;
  };

  return <>{getLiquidityView()}</>;
};
