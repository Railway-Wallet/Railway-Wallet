import {
  LiquidityV2Pool,
  RecipeAddLiquidityData,
  RecipeERC20Info,
  UniV2LikeAddLiquidityRecipe,
} from "@railgun-community/cookbook";
import { isDefined } from "@railgun-community/shared-models";
import { useEffect, useMemo, useRef, useState } from "react";
import { Provider } from "ethers";
import { ERC20Amount } from "../../models/token";
import { ProviderService } from "../../services";
import {
  createERC20AmountFromRecipeERC20Amount,
  generateKey,
  getRecipeERC20Amount,
  getSlippageBasisPoints,
} from "../../utils";
import { useReduxSelector } from "../hooks-redux";
import { useRecipe } from "./useRecipe";

export const useAddLiquidityRecipe = (
  liquidityPool: LiquidityV2Pool,
  tokenUnshieldAmountA: Optional<ERC20Amount>,
  slippagePercentage: Optional<number>
) => {
  const { wallets } = useReduxSelector("wallets");
  const { network } = useReduxSelector("network");
  const networkName = network.current.name;

  const [tokenUnshieldAmountB, setTokenUnshieldAmountB] =
    useState<Optional<ERC20Amount>>(undefined);
  const [addLiquidityData, setAddLiquidityData] =
    useState<Optional<RecipeAddLiquidityData>>(undefined);
  const [lpMinimum, setLpMinimum] = useState<Optional<string>>(undefined);
  const [provider, setProvider] = useState<Optional<Provider>>(undefined);
  const latestTokenBCalculationID = useRef<Optional<string>>();

  useEffect(() => {
    setProvider(undefined);
    const updateProvider = async () => {
      const provider = await ProviderService.getProvider(networkName);
      setProvider(provider);
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateProvider();
  }, [networkName]);

  const addLiquidityRecipe: Optional<UniV2LikeAddLiquidityRecipe> =
    useMemo(() => {
      if (!isDefined(provider) || !isDefined(slippagePercentage)) {
        return undefined;
      }

      const slippageBasisPoints = getSlippageBasisPoints(slippagePercentage);

      const erc20InfoA: RecipeERC20Info = {
        tokenAddress: liquidityPool.tokenAddressA,
        decimals: liquidityPool.tokenDecimalsA,
      };

      const erc20InfoB: RecipeERC20Info = {
        tokenAddress: liquidityPool.tokenAddressB,
        decimals: liquidityPool.tokenDecimalsB,
      };

      return new UniV2LikeAddLiquidityRecipe(
        liquidityPool.uniswapV2Fork,
        erc20InfoA,
        erc20InfoB,
        slippageBasisPoints,
        provider
      );
    }, [liquidityPool, provider, slippagePercentage]);

  useEffect(() => {
    const updateAmountBInfo = async () => {
      const currentTokenBCalculationID = generateKey();
      latestTokenBCalculationID.current = currentTokenBCalculationID;

      if (!isDefined(addLiquidityRecipe) || !isDefined(tokenUnshieldAmountA)) {
        setTokenUnshieldAmountB(undefined);
        setAddLiquidityData(undefined);
        return;
      }

      const { erc20UnshieldAmountB, addLiquidityData: liquidityData } =
        await addLiquidityRecipe.getAddLiquidityAmountBForUnshield(
          networkName,
          getRecipeERC20Amount(tokenUnshieldAmountA)
        );

      if (currentTokenBCalculationID === latestTokenBCalculationID.current) {
        setTokenUnshieldAmountB(
          createERC20AmountFromRecipeERC20Amount(
            wallets.active,
            networkName,
            erc20UnshieldAmountB
          )
        );
        setAddLiquidityData(liquidityData);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateAmountBInfo();
  }, [tokenUnshieldAmountA, addLiquidityRecipe, networkName, wallets.active]);

  const unshieldERC20Amounts =
    isDefined(tokenUnshieldAmountA) && isDefined(tokenUnshieldAmountB)
      ? [tokenUnshieldAmountA, tokenUnshieldAmountB]
      : [];

  const { recipe, recipeError, recipeOutput, isLoadingRecipeOutput } =
    useRecipe(addLiquidityRecipe, unshieldERC20Amounts, []);

  useEffect(() => {
    if (!isDefined(recipeOutput) || !isDefined(addLiquidityRecipe)) {
      setLpMinimum(undefined);
      return;
    }

    const lpAmount =
      addLiquidityRecipe.getExpectedLPAmountFromRecipeOutput(recipeOutput);
    if (!isDefined(lpAmount)) {
      setLpMinimum(undefined);
      return;
    }

    setLpMinimum(lpAmount.lpMinimum.toString());
  }, [recipeOutput, addLiquidityRecipe]);

  return {
    recipe,
    recipeError,
    recipeOutput,
    isLoadingRecipeOutput,
    tokenUnshieldAmountB,
    addLiquidityData,
    lpMinimum,
  };
};
