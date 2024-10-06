import {
  RecipeOutput,
  SwapQuoteData,
  SwapRecipe,
} from "@railgun-community/cookbook";
import { useCallback, useEffect, useRef, useState } from "react";
import { CookbookSwapRecipeType } from "../../models/cookbook";
import { ERC20Amount, ERC20Token } from "../../models/token";
import { useSwapQuoteSignificantlyChanged } from "./useSwapQuoteSignificantlyChanged";
import { useSwapRecipe } from "./useSwapRecipe";

export const useUpdatingSwapRecipe = (
  swapRecipeType: CookbookSwapRecipeType,
  originalRecipe: SwapRecipe,
  originalRecipeOutput: RecipeOutput,
  originalQuote: SwapQuoteData,
  sellERC20Amount: Optional<ERC20Amount>,
  buyERC20: ERC20Token,
  slippagePercentage: number,
  swapDestinationAddress: Optional<string>
) => {
  if (!sellERC20Amount) {
    throw new Error("Requires sell amount for swap confirm");
  }

  const [lockedQuote, setLockedQuote] = useState<SwapQuoteData>(originalQuote);
  const [lockedRecipe, setLockedRecipe] = useState<SwapRecipe>(originalRecipe);
  const [lockedRecipeOutput, setLockedRecipeOutput] =
    useState<RecipeOutput>(originalRecipeOutput);

  const currentQuoteSellERC20Amount = useRef(sellERC20Amount);
  const sellAmountChanged =
    sellERC20Amount?.amountString !==
    currentQuoteSellERC20Amount.current?.amountString;

  const currentSwapDestinationAddress = useRef(swapDestinationAddress);
  const swapDestinationAddressChanged =
    swapDestinationAddress !== currentSwapDestinationAddress.current;

  const {
    quote: currentQuote,
    recipe: currentRecipe,
    recipeOutput: currentRecipeOutput,
    isLoadingRecipeOutput,
    recipeError,
  } = useSwapRecipe(
    swapRecipeType,
    sellERC20Amount,
    buyERC20,
    slippagePercentage,
    swapDestinationAddress
  );

  const { quoteSignificantlyChanged } = useSwapQuoteSignificantlyChanged(
    lockedQuote,
    currentQuote
  );

  const updateCurrentLockedQuote = useCallback(
    (forceUpdate = false) => {
      if (!currentQuote || !currentRecipe || !currentRecipeOutput) {
        return;
      }

      const recipeChanged = currentRecipe.id !== lockedRecipe.id;
      const shouldUpdate =
        sellAmountChanged ||
        swapDestinationAddressChanged ||
        recipeChanged ||
        forceUpdate;
      if (!shouldUpdate) {
        return;
      }

      currentQuoteSellERC20Amount.current = sellERC20Amount;
      currentSwapDestinationAddress.current = swapDestinationAddress;
      setLockedQuote(currentQuote);
      setLockedRecipe(currentRecipe);
      setLockedRecipeOutput(currentRecipeOutput);
    },
    [
      currentQuote,
      currentRecipe,
      currentRecipeOutput,
      lockedRecipe.id,
      sellAmountChanged,
      swapDestinationAddressChanged,
      sellERC20Amount,
      swapDestinationAddress,
    ]
  );

  useEffect(() => {
    updateCurrentLockedQuote();
  }, [
    swapDestinationAddress,
    sellERC20Amount,
    currentRecipeOutput,
    updateCurrentLockedQuote,
  ]);

  const recipeAmounts =
    lockedRecipe.getBuySellAmountsFromRecipeOutput(lockedRecipeOutput);
  if (!recipeAmounts) {
    throw new Error("Requires buy/sell amounts for swap confirm");
  }
  const sellERC20Fee: ERC20Amount = {
    token: sellERC20Amount.token,
    amountString: recipeAmounts.sellUnshieldFee.toString(),
  };
  const buyERC20Amount: ERC20Amount = {
    token: buyERC20,
    amountString: recipeAmounts.buyAmount.toString(),
  };
  const buyERC20Minimum: ERC20Amount = {
    token: buyERC20,
    amountString: recipeAmounts.buyMinimum.toString(),
  };
  const buyERC20Fee: ERC20Amount = {
    token: buyERC20,
    amountString: recipeAmounts.buyShieldFee.toString(),
  };

  return {
    lockedQuote,
    updateQuote: () => updateCurrentLockedQuote(true),
    quoteOutdated: quoteSignificantlyChanged || sellAmountChanged,
    lockedRecipeOutput,
    sellERC20Fee,
    buyERC20Amount,
    buyERC20Minimum,
    buyERC20Fee,
    isLoadingRecipeOutput,
    recipeError,
  };
};
