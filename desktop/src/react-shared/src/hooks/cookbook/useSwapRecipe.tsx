import {
  RecipeERC20Info,
  type SwapQuoteData,
  ZeroXConfig,
  ZeroXV2SwapRecipe,
} from '@railgun-community/cookbook';
import { isDefined, NETWORK_CONFIG } from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import { CookbookSwapRecipeType } from '../../models/cookbook';
import { ERC20Amount, ERC20Token } from '../../models/token';
import {
  compareRecipeERC20Info,
  getRecipeERC20Info,
  getSlippageBasisPoints,
  is7702Network,
} from '../../utils';
import { useReduxSelector } from '../hooks-redux';
import { useMemoCustomCompare } from '../react-extensions';
import { Ephemeral7702ZeroXV2SwapRecipe } from './ephemeral-7702-zero-x-v2-swap-recipe';
import { useRecipe } from './useRecipe';

export const useSwapRecipe = (
  swapRecipeType: CookbookSwapRecipeType,
  sellERC20Amount: Optional<ERC20Amount>,
  buyERC20: Optional<ERC20Token>,
  slippagePercentage: number,
  swapDestinationAddress: Optional<string>,
  ephemeralAddress: Optional<string>,
) => {
  const { remoteConfig } = useReduxSelector('remoteConfig');
  const { network } = useReduxSelector('network');

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;
  const slippageBasisPoints = useMemo(
    () => getSlippageBasisPoints(slippagePercentage),
    [slippagePercentage],
  );

  const [quote, setQuote] = useState<Optional<SwapQuoteData>>();

  const sellERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    sellERC20Amount ? getRecipeERC20Info(sellERC20Amount.token) : undefined,
    compareRecipeERC20Info,
  );
  const buyERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    buyERC20 ? getRecipeERC20Info(buyERC20) : undefined,
    compareRecipeERC20Info,
  );
  const swapRecipe: Optional<ZeroXV2SwapRecipe> = useMemo(() => {
    if (!sellERC20Info || !buyERC20Info) {
      return undefined;
    }
    const slippageBasisPointsNumber = parseInt(
      slippageBasisPoints.toString(),
      10,
    );
    switch (swapRecipeType) {
      case CookbookSwapRecipeType.ZeroX:
        if (isDefined(ephemeralAddress) &&
        is7702Network(network.current.name)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return new Ephemeral7702ZeroXV2SwapRecipe(
            sellERC20Info,
            buyERC20Info,
            slippageBasisPointsNumber,
            swapDestinationAddress,
            ephemeralAddress,
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
        return new ZeroXV2SwapRecipe(
          sellERC20Info,
          buyERC20Info,
          slippageBasisPointsNumber,
          NETWORK_CONFIG[network.current.name].relayAdaptContract,
          swapDestinationAddress,
        );
    }
  }, [
    sellERC20Info,
    buyERC20Info,
    swapRecipeType,
    slippageBasisPoints,
    swapDestinationAddress,
    ephemeralAddress,
    network,
  ]);

  const unshieldERC20Amounts = sellERC20Amount ? [sellERC20Amount] : [];
  const { recipe, recipeError, recipeOutput, isLoadingRecipeOutput } =
    useRecipe(
      swapRecipe,
      unshieldERC20Amounts,
      [],
    );

  useEffect(() => {
    setQuote(recipe?.getLatestQuote());
  }, [recipe, recipeOutput]);

  useEffect(() => {
    setQuote(undefined);
  }, [sellERC20Info]);

  return {
    recipe,
    recipeError,
    recipeOutput,
    isLoadingRecipeOutput,
    quote,
  };
};
