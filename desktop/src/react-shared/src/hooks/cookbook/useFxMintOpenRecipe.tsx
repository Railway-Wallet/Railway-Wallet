import {
  fxCollateralERC20Info,
  FxMintPoolRef,
  getFxPool,
  getNextFxPositionId,
  RecipeERC20Info,
  ZeroXConfig,
  ZeroXSwap_FxMintOpen_ComboMeal,
} from '@railgun-community/cookbook';
import { isDefined, NetworkName } from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import { ERC20Amount } from '../../models/token';
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

type FxOpenParams = {
  borrowFeeRatio: bigint;
  predictedPositionId: bigint;
  collateralInfo: RecipeERC20Info;
};

const poolRefKey = (pool: FxMintPoolRef): string =>
  typeof pool === 'string' ? pool : pool.address;

export const useFxMintOpenRecipe = (
  pool: Optional<FxMintPoolRef>,
  sellERC20Amount: Optional<ERC20Amount>,
  targetDebt: Optional<bigint>,
  slippagePercentage: number,
  ephemeralAddress: Optional<string>,
) => {
  const { network } = useReduxSelector('network');
  const { remoteConfig } = useReduxSelector('remoteConfig');
  const networkName = network.current.name;
  const isSupported = networkName === FXMINT_NETWORK;

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;

  const [params, setParams] = useState<Optional<FxOpenParams>>();
  const [paramsError, setParamsError] = useState<Optional<Error>>();
  const [paramsLoading, setParamsLoading] = useState(false);

  const poolKey = isDefined(pool) ? poolRefKey(pool) : undefined;

  useEffect(() => {
    if (!isDefined(pool) || !isSupported) {
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
        const fxPool = await getFxPool(pool, provider);
        const predictedPositionId = await getNextFxPositionId(pool, provider);
        if (!cancelled) {
          setParams({
            borrowFeeRatio: fxPool.borrowFeeRatio,
            predictedPositionId,
            collateralInfo: fxCollateralERC20Info(pool),
          });
        }
      } catch (err) {
        if (!cancelled) {
          logDevError(
            new Error('Failed to read f(x) pool parameters', {
              cause: err,
            }),
          );
          setParams(undefined);
          setParamsError(
            new Error(
              'Could not read the f(x) pool parameters (fee ratio / next position id).',
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
  }, [poolKey, networkName, isSupported]);

  const slippageBasisPoints = useMemo(
    () => parseInt(getSlippageBasisPoints(slippagePercentage).toString(), 10),
    [slippagePercentage],
  );

  const sellERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    sellERC20Amount ? getRecipeERC20Info(sellERC20Amount.token) : undefined,
    compareRecipeERC20Info,
  );

  const comboMeal: Optional<ZeroXSwap_FxMintOpen_ComboMeal> = useMemo(() => {
    if (
      !isDefined(pool) ||
      !sellERC20Info ||
      !params ||
      !isDefined(targetDebt) ||
      targetDebt <= 0n ||
      !isDefined(ephemeralAddress)
    ) {
      return undefined;
    }
    return new ZeroXSwap_FxMintOpen_ComboMeal({
      pool,
      targetDebt,
      predictedPositionId: params.predictedPositionId,
      borrowFeeRatio: params.borrowFeeRatio,
      sellERC20Info,
      swapSlippageBasisPoints: slippageBasisPoints,
      recipient: ephemeralAddress,
    });
  }, [
    pool,
    sellERC20Info,
    params,
    targetDebt,
    slippageBasisPoints,
    ephemeralAddress,
  ]);

  const unshieldERC20Amounts = sellERC20Amount ? [sellERC20Amount] : [];
  const { recipeOutput, recipeError, isLoadingRecipeOutput } = useComboMeal(
    comboMeal,
    unshieldERC20Amounts,
    [],
  );

  return {
    recipeOutput,
    isLoading: paramsLoading || isLoadingRecipeOutput,
    error: paramsError ?? recipeError,
    isSupported,
    collateralInfo: params?.collateralInfo,
    predictedPositionId: params?.predictedPositionId,
  };
};
