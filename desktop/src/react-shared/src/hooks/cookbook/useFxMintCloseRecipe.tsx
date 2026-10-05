import {
  computeFxClose,
  FxMintClose_ZeroXSwap_ComboMeal,
  FxMintPoolRef,
  getFxPool,
  getFxPosition,
  RecipeERC20Info,
  ZeroXConfig,
} from '@railgun-community/cookbook';
import {
  isDefined,
  NetworkName,
  NFTAmount,
} from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import { ERC20Amount, ERC20Token } from '../../models/token';
import { ProviderService } from '../../services/providers/provider-service';
import {
  compareRecipeERC20Info,
  getRecipeERC20Info,
  getSlippageBasisPoints,
} from '../../utils';
import { logDevError } from '../../utils/logging';
import { useReduxSelector } from '../hooks-redux';
import { useMemoCustomCompare } from '../react-extensions';
import { useComboMeal } from './useComboMeal';

const FXMINT_NETWORK = NetworkName.Ethereum;

const DEFAULT_UNSHIELD_FEE_BPS = 25n;

type FxCloseParams = {
  repayAmount: bigint;
  approveAmount: bigint;
  withdrawColl: bigint;
  withdrawFeeRatio: bigint;
  partialClose: boolean;
};

const poolRefKey = (pool: FxMintPoolRef): string =>
  typeof pool === 'string' ? pool : pool.address;

export const useFxMintCloseRecipe = (
  pool: Optional<FxMintPoolRef>,
  positionId: Optional<bigint>,
  positionNFT: Optional<NFTAmount>,
  debtToken: Optional<ERC20Token>,
  buyERC20: Optional<ERC20Token>,
  shieldedDebt: Optional<bigint>,
  slippagePercentage: number,
  ephemeralAddress: Optional<string>,
) => {
  const { network } = useReduxSelector('network');
  const { remoteConfig } = useReduxSelector('remoteConfig');
  const networkName = network.current.name;
  const isSupported = networkName === FXMINT_NETWORK;

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;

  const railgunUnshieldFeeBps = useMemo(() => {
    const raw = network.current.feesSerialized?.unshieldFeeV2;
    return isDefined(raw) ? BigInt(raw) : DEFAULT_UNSHIELD_FEE_BPS;
  }, [network]);

  const [params, setParams] = useState<Optional<FxCloseParams>>();
  const [paramsError, setParamsError] = useState<Optional<Error>>();
  const [paramsLoading, setParamsLoading] = useState(false);

  const poolKey = isDefined(pool) ? poolRefKey(pool) : undefined;
  const positionKey = isDefined(positionId) ? positionId.toString() : undefined;
  const shieldedKey = isDefined(shieldedDebt)
    ? shieldedDebt.toString()
    : undefined;

  useEffect(() => {
    if (
      !isDefined(pool) ||
      !isDefined(positionId) ||
      !isDefined(shieldedDebt) ||
      shieldedDebt <= 0n ||
      !isSupported
    ) {
      setParams(undefined);
      setParamsError(undefined);
      return;
    }
    let cancelled = false;
    setParamsLoading(true);
    setParamsError(undefined);
    const readParams = async () => {
      try {
        const provider = await ProviderService.getProvider(networkName);
        const [fxPool, fxPosition] = await Promise.all([
          getFxPool(pool, provider),
          getFxPosition(positionId, pool, provider),
        ]);
        const close = computeFxClose({
          collateral: fxPosition.collateralAmount,
          debt: fxPosition.debt,
          availableDebtToken: shieldedDebt,
          repayFeeRatio: fxPool.repayFeeRatio,
          withdrawFeeRatio: fxPool.withdrawFeeRatio,
          railgunUnshieldFeeBps,
        });

        if (!cancelled) {
          setParams({
            repayAmount: close.repayAmount,
            approveAmount: close.approveAmount,
            withdrawColl: close.withdrawColl,
            withdrawFeeRatio: fxPool.withdrawFeeRatio,
            partialClose: close.partialClose,
          });
        }
      } catch (err) {
        if (!cancelled) {
          logDevError(
            new Error('Failed to size f(x) position close', { cause: err }),
          );
          setParams(undefined);
          setParamsError(
            new Error(
              'Could not read the f(x) position / pool state to size the close.',
              { cause: err },
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setParamsLoading(false);
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    readParams();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolKey, positionKey, shieldedKey, networkName, isSupported]);

  const slippageBasisPoints = useMemo(
    () => parseInt(getSlippageBasisPoints(slippagePercentage).toString(), 10),
    [slippagePercentage],
  );

  const buyERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    buyERC20 ? getRecipeERC20Info(buyERC20) : undefined,
    compareRecipeERC20Info,
  );

  const comboMeal: Optional<FxMintClose_ZeroXSwap_ComboMeal> = useMemo(() => {
    if (
      !isDefined(pool) ||
      !isDefined(positionId) ||
      !params ||
      params.repayAmount <= 0n ||
      !buyERC20Info ||
      !isDefined(ephemeralAddress)
    ) {
      return undefined;
    }
    return new FxMintClose_ZeroXSwap_ComboMeal({
      pool,
      positionId,
      repayAmount: params.repayAmount,
      withdrawColl: params.withdrawColl,
      approveAmount: params.approveAmount,
      withdrawFeeRatio: params.withdrawFeeRatio,
      partialClose: params.partialClose,
      buyERC20Info,
      swapSlippageBasisPoints: slippageBasisPoints,
      recipient: ephemeralAddress,
    });
  }, [
    pool,
    positionId,
    params,
    buyERC20Info,
    slippageBasisPoints,
    ephemeralAddress,
  ]);

  const unshieldERC20Amounts: ERC20Amount[] =
    isDefined(debtToken) && isDefined(shieldedDebt) && shieldedDebt > 0n
      ? [{ token: debtToken, amountString: shieldedDebt.toString() }]
      : [];
  const unshieldNFTAmounts = positionNFT ? [positionNFT] : [];
  const { recipeOutput, recipeError, isLoadingRecipeOutput } = useComboMeal(
    comboMeal,
    unshieldERC20Amounts,
    unshieldNFTAmounts,
  );

  return {
    recipeOutput,
    isLoading: paramsLoading || isLoadingRecipeOutput,
    error: paramsError ?? recipeError,
    isSupported,
    partialClose: params?.partialClose,
    repayAmount: params?.repayAmount,
    withdrawColl: params?.withdrawColl,
  };
};
