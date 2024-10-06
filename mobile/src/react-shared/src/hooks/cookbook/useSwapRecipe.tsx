import {
  RecipeERC20Info,
  SwapQuoteData,
  SwapRecipe,
  ZeroXConfig,
  ZeroXSwapRecipe,
} from "@railgun-community/cookbook";
import { useEffect, useMemo, useState } from "react";
import { CookbookSwapRecipeType } from "../../models/cookbook";
import { ERC20Amount, ERC20Token } from "../../models/token";
import {
  compareRecipeERC20Info,
  getRecipeERC20Info,
  getSlippageBasisPoints,
} from "../../utils";
import { useReduxSelector } from "../hooks-redux";
import { useMemoCustomCompare } from "../react-extensions";
import { useRecipe } from "./useRecipe";

export const useSwapRecipe = (
  swapRecipeType: CookbookSwapRecipeType,
  sellERC20Amount: Optional<ERC20Amount>,
  buyERC20: Optional<ERC20Token>,
  slippagePercentage: number,
  swapDestinationAddress: Optional<string>
) => {
  const { remoteConfig } = useReduxSelector("remoteConfig");

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;
  const slippageBasisPoints = useMemo(
    () => getSlippageBasisPoints(slippagePercentage),
    [slippagePercentage]
  );

  const [quote, setQuote] = useState<Optional<SwapQuoteData>>();

  const sellERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    sellERC20Amount ? getRecipeERC20Info(sellERC20Amount.token) : undefined,
    compareRecipeERC20Info
  );
  const buyERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    buyERC20 ? getRecipeERC20Info(buyERC20) : undefined,
    compareRecipeERC20Info
  );

  const swapRecipe: Optional<SwapRecipe> = useMemo(() => {
    if (!sellERC20Info || !buyERC20Info) {
      return undefined;
    }
    switch (swapRecipeType) {
      case CookbookSwapRecipeType.ZeroX:
        return new ZeroXSwapRecipe(
          sellERC20Info,
          buyERC20Info,
          slippageBasisPoints,
          swapDestinationAddress
        );
    }
  }, [
    sellERC20Info,
    buyERC20Info,
    swapRecipeType,
    slippageBasisPoints,
    swapDestinationAddress,
  ]);

  const unshieldERC20Amounts = sellERC20Amount ? [sellERC20Amount] : [];
  const { recipe, recipeError, recipeOutput, isLoadingRecipeOutput } =
    useRecipe(swapRecipe, unshieldERC20Amounts, []);

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
