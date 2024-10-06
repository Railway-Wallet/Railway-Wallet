import {
  LiquidityV2Pool,
  RecipeERC20Info,
  RecipeRemoveLiquidityData,
  UniV2LikeRemoveLiquidityRecipe,
} from "@railgun-community/cookbook";
import { isDefined } from "@railgun-community/shared-models";
import { useEffect, useMemo, useRef, useState } from "react";
import { Provider } from "ethers";
import { ERC20Amount } from "../../models/token";
import { ProviderService } from "../../services";
import {
  generateKey,
  getRecipeERC20Amount,
  getSlippageBasisPoints,
} from "../../utils";
import { useReduxSelector } from "../hooks-redux";
import { useRecipe } from "./useRecipe";

export const useRemoveLiquidityRecipe = (
  liquidityPool: LiquidityV2Pool,
  tokenUnshieldAmount: Optional<ERC20Amount>,
  slippagePercentage: Optional<number>
) => {
  const { network } = useReduxSelector("network");
  const networkName = network.current.name;

  const [removeLiquidityData, setRemoveLiquidityData] =
    useState<Optional<RecipeRemoveLiquidityData>>(undefined);
  const [provider, setProvider] = useState<Optional<Provider>>(undefined);
  const [tokenAMinimum, setTokenAMinimum] =
    useState<Optional<string>>(undefined);
  const [tokenBMinimum, setTokenBMinimum] =
    useState<Optional<string>>(undefined);
  const removeLiquidityCalculationID = useRef<Optional<string>>();

  useEffect(() => {
    setProvider(undefined);
    const updateProvider = async () => {
      const provider = await ProviderService.getProvider(networkName);
      setProvider(provider);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateProvider();
  }, [networkName]);

  const removeLiquidityRecipe: Optional<UniV2LikeRemoveLiquidityRecipe> =
    useMemo(() => {
      if (!isDefined(provider) || !isDefined(slippagePercentage)) {
        return undefined;
      }
      const slippageBasisPoints = getSlippageBasisPoints(slippagePercentage);

      const lpERC20Info: RecipeERC20Info = {
        tokenAddress: liquidityPool.pairAddress,
        decimals: liquidityPool.pairTokenDecimals,
      };

      const erc20InfoA: RecipeERC20Info = {
        tokenAddress: liquidityPool.tokenAddressA,
        decimals: liquidityPool.tokenDecimalsA,
      };

      const erc20InfoB: RecipeERC20Info = {
        tokenAddress: liquidityPool.tokenAddressB,
        decimals: liquidityPool.tokenDecimalsB,
      };

      return new UniV2LikeRemoveLiquidityRecipe(
        liquidityPool.uniswapV2Fork,
        lpERC20Info,
        erc20InfoA,
        erc20InfoB,
        slippageBasisPoints,
        provider
      );
    }, [liquidityPool, provider, slippagePercentage]);

  useEffect(() => {
    const updateRemoveLiquidityData = async () => {
      const calculationID = generateKey();
      removeLiquidityCalculationID.current = calculationID;

      if (
        !isDefined(removeLiquidityRecipe) ||
        !isDefined(tokenUnshieldAmount)
      ) {
        setRemoveLiquidityData(undefined);
        return;
      }

      const removeLiquidityData =
        await removeLiquidityRecipe.getRemoveLiquidityData(
          networkName,
          getRecipeERC20Amount(tokenUnshieldAmount)
        );

      if (calculationID === removeLiquidityCalculationID.current) {
        setRemoveLiquidityData(removeLiquidityData);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateRemoveLiquidityData();
  }, [tokenUnshieldAmount, removeLiquidityRecipe, networkName]);

  const unshieldERC20Amounts = isDefined(tokenUnshieldAmount)
    ? [tokenUnshieldAmount]
    : [];

  const { recipe, recipeError, recipeOutput, isLoadingRecipeOutput } =
    useRecipe(removeLiquidityRecipe, unshieldERC20Amounts, []);

  useEffect(() => {
    if (!isDefined(recipeOutput) || !isDefined(removeLiquidityRecipe)) {
      setTokenAMinimum(undefined);
      setTokenBMinimum(undefined);
      return;
    }

    const expectedAmounts =
      removeLiquidityRecipe.getExpectedABAmountsFromRecipeOutput(recipeOutput);

    if (isDefined(expectedAmounts)) {
      setTokenAMinimum(expectedAmounts.aMinimum.toString());
      setTokenBMinimum(expectedAmounts.bMinimum.toString());
    } else {
      setTokenAMinimum(undefined);
      setTokenBMinimum(undefined);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeOutput]);

  return {
    recipe,
    recipeError,
    recipeOutput,
    isLoadingRecipeOutput,
    removeLiquidityData,
    tokenAMinimum,
    tokenBMinimum,
  };
};
