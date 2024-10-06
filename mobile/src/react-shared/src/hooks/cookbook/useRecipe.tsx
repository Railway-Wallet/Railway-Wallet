import {
  Recipe,
  RecipeERC20Amount,
  RecipeInput,
  RecipeOutput,
} from "@railgun-community/cookbook";
import { delay, NFTAmount } from "@railgun-community/shared-models";
import { useEffect, useMemo, useRef, useState } from "react";
import { ERC20Amount } from "../../models";
import { generateKey, logDevError } from "../../utils";
import {
  compareERC20AmountArrays,
  compareNFTAmountArrays,
  createRailgunNFTAmounts,
} from "../../utils/tokens";
import { useReduxSelector } from "../hooks-redux";
import { useMemoCustomCompare } from "../react-extensions";

export const useRecipe = <T extends Recipe>(
  recipe: Optional<T>,
  unshieldERC20Amounts: ERC20Amount[],
  unshieldNFTAmounts: NFTAmount[]
) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const [currentRecipe, setCurrentRecipe] = useState<Optional<T>>();
  const [recipeOutput, setRecipeOutput] = useState<Optional<RecipeOutput>>();
  const [recipeError, setRecipeError] = useState<Optional<Error>>();
  const [isLoadingRecipeOutput, setIsLoadingRecipeOutput] =
    useState<boolean>(false);

  const latestRecipeRunID = useRef<Optional<string>>();

  const relayAdaptUnshieldERC20Amounts: ERC20Amount[] = useMemoCustomCompare(
    unshieldERC20Amounts,
    compareERC20AmountArrays
  );
  const relayAdaptUnshieldNFTAmounts: NFTAmount[] = useMemoCustomCompare(
    unshieldNFTAmounts,
    compareNFTAmountArrays
  );

  const recipeInput: RecipeInput = useMemo(() => {
    const erc20Amounts: RecipeERC20Amount[] =
      relayAdaptUnshieldERC20Amounts.map((erc20Amount) => ({
        tokenAddress: erc20Amount.token.address,
        decimals: BigInt(erc20Amount.token.decimals),
        isBaseToken: erc20Amount.token.isBaseToken,
        amount: BigInt(erc20Amount.amountString),
      }));
    const recipeInput: RecipeInput = {
      railgunAddress: wallets.active?.railAddress ?? "No Active Wallet",
      networkName: network.current.name,
      erc20Amounts,
      nfts: createRailgunNFTAmounts(relayAdaptUnshieldNFTAmounts),
    };
    return recipeInput;
  }, [
    network,
    relayAdaptUnshieldERC20Amounts,
    relayAdaptUnshieldNFTAmounts,
    wallets.active?.railAddress,
  ]);

  useEffect(() => {
    setRecipeError(undefined);
    setIsLoadingRecipeOutput(true);

    const currentRecipeRunID = generateKey(16);
    latestRecipeRunID.current = currentRecipeRunID;

    const updateRecipeOutput = async () => {
      await delay(500);
      if (currentRecipeRunID !== latestRecipeRunID.current) {
        return;
      }

      try {
        if (!recipe) {
          setIsLoadingRecipeOutput(false);
          return;
        }
        const output = await recipe.getRecipeOutput(recipeInput);
        if (currentRecipeRunID === latestRecipeRunID.current) {
          setCurrentRecipe(recipe);
          setRecipeOutput(output);
        }
        setIsLoadingRecipeOutput(false);
      } catch (err) {
        const error = new Error("Error updating recipe output", {
          cause: err,
        });
        logDevError(error);
        if (currentRecipeRunID === latestRecipeRunID.current) {
          setCurrentRecipe(undefined);
          setRecipeOutput(undefined);
          setRecipeError(error);
        }
        setIsLoadingRecipeOutput(false);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateRecipeOutput();
  }, [recipe, recipeInput]);

  return {
    recipe: currentRecipe,
    recipeOutput,
    recipeError,
    isLoadingRecipeOutput,
  };
};
