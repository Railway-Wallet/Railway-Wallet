import {
  FxMintPoolRef,
  getFxPool,
  RecipeERC20Info,
  ZeroXConfig,
  ZeroXSwap_FxMintTopup_ComboMeal,
  ZeroXSwap_FxMintTopupAndBorrow_ComboMeal,
} from '@railgun-community/cookbook';
import {
  isDefined,
  NetworkName,
  NFTAmount,
} from '@railgun-community/shared-models';
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

const poolRefKey = (pool: FxMintPoolRef): string =>
  typeof pool === 'string' ? pool : pool.address;

export const useFxMintTopupRecipe = (
  pool: Optional<FxMintPoolRef>,
  positionId: Optional<bigint>,
  positionNFT: Optional<NFTAmount>,
  sellERC20Amount: Optional<ERC20Amount>,
  additionalDebt: Optional<bigint>,
  slippagePercentage: number,
  ephemeralAddress: Optional<string>,
) => {
  const { network } = useReduxSelector('network');
  const { remoteConfig } = useReduxSelector('remoteConfig');
  const networkName = network.current.name;
  const isSupported = networkName === FXMINT_NETWORK;

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;

  const [borrowFeeRatio, setBorrowFeeRatio] = useState<Optional<bigint>>();
  const [paramsError, setParamsError] = useState<Optional<Error>>();
  const [paramsLoading, setParamsLoading] = useState(false);

  const poolKey = isDefined(pool) ? poolRefKey(pool) : undefined;

  useEffect(() => {
    if (!isDefined(pool) || !isSupported) {
      setBorrowFeeRatio(undefined);
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
        if (!cancelled) {
          setBorrowFeeRatio(fxPool.borrowFeeRatio);
        }
      } catch (err) {
        if (!cancelled) {
          logDevError(
            new Error('Failed to read f(x) pool borrow fee ratio', {
              cause: err,
            }),
          );
          setBorrowFeeRatio(undefined);
          setParamsError(
            new Error('Could not read the f(x) pool parameters (fee ratio).', {
              cause: err,
            }),
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

  const isBorrowing = isDefined(additionalDebt) && additionalDebt > 0n;

  const comboMeal = useMemo(():
    | ZeroXSwap_FxMintTopup_ComboMeal
    | ZeroXSwap_FxMintTopupAndBorrow_ComboMeal
    | undefined => {
    if (
      !isDefined(pool) ||
      !isDefined(positionId) ||
      !sellERC20Info ||
      !isDefined(ephemeralAddress)
    ) {
      return undefined;
    }
    if (isBorrowing) {
      if (!isDefined(additionalDebt) || !isDefined(borrowFeeRatio)) {
        return undefined;
      }
      return new ZeroXSwap_FxMintTopupAndBorrow_ComboMeal({
        pool,
        positionId,
        additionalDebt,
        borrowFeeRatio,
        sellERC20Info,
        swapSlippageBasisPoints: slippageBasisPoints,
        recipient: ephemeralAddress,
      });
    }
    return new ZeroXSwap_FxMintTopup_ComboMeal({
      pool,
      positionId,
      sellERC20Info,
      swapSlippageBasisPoints: slippageBasisPoints,
      recipient: ephemeralAddress,
    });
  }, [
    pool,
    positionId,
    sellERC20Info,
    isBorrowing,
    additionalDebt,
    borrowFeeRatio,
    slippageBasisPoints,
    ephemeralAddress,
  ]);

  const unshieldERC20Amounts = sellERC20Amount ? [sellERC20Amount] : [];
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
    isBorrowing,
  };
};
