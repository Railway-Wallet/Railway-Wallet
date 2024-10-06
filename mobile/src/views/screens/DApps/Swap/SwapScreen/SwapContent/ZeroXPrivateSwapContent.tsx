import { isDefined } from "@railgun-community/shared-models";
import React from "react";
import { Alert } from "react-native";
import {
  CookbookSwapRecipeType,
  ERC20Amount,
  StorageService,
  useSwapRecipe,
} from "@react-shared";
import {
  HapticSurface,
  triggerHaptic,
} from "../../../../../../services/util/haptic-service";
import { Constants } from "../../../../../../utils/constants";
import { SharedSwapContent, SwapContentProps } from "./SharedSwapContent";

export const ZeroXPrivateSwapContent: React.FC<SwapContentProps> = ({
  navigation,
  swapSettings,
  sellERC20Amount,
  buyERC20,
  returnBackFromCompletedOrder,
  ...props
}: SwapContentProps) => {
  const swapRecipeType = CookbookSwapRecipeType.ZeroX;

  const { quote, recipeError, isLoadingRecipeOutput, recipe, recipeOutput } =
    useSwapRecipe(
      swapRecipeType,
      sellERC20Amount,
      buyERC20,
      swapSettings.slippagePercentage,
      undefined
    );

  const recipeAmounts = recipe?.getBuySellAmountsFromRecipeOutput(recipeOutput);
  const buyERC20Amount: Optional<ERC20Amount> =
    recipeAmounts && buyERC20
      ? {
          token: buyERC20,
          amountString: recipeAmounts.buyAmount.toString(),
        }
      : undefined;

  const goToReviewOrder = () => {
    if (!sellERC20Amount || !buyERC20 || !quote || !recipe || !recipeOutput) {
      return;
    }
    navigation.navigate("SwapPrivateConfirm", {
      returnBackFromCompletedOrder,
      originalQuote: quote,
      originalRecipe: recipe,
      originalRecipeOutput: recipeOutput,
      swapRecipeType,
      sellERC20Amount,
      buyERC20: buyERC20,
      originalSlippagePercentage: swapSettings.slippagePercentage,
    });
  };

  const onTapReviewOrder = async () => {
    if (!sellERC20Amount || !buyERC20 || !quote) {
      return;
    }
    const hasShownWarningFirstPrivateSwap = await StorageService.getItem(
      Constants.HAS_SHOWN_WARNING_FIRST_PRIVATE_SWAP
    );
    if (!isDefined(hasShownWarningFirstPrivateSwap)) {
      showFirstPrivateSwapWarning();
      return;
    }

    triggerHaptic(HapticSurface.NavigationButton);
    goToReviewOrder();
  };

  const showFirstPrivateSwapWarning = () => {
    Alert.alert(
      "WARNING: Private DEX",
      "Do not use the RAILGUN system for private swaps if the slippage is likely to be above 2%, ie. for tokens with volatile prices or low liquidity. \n\nFor volatile tokens, multiple smaller trades will ensure safety. \n\nPlease note that private DEX transactions incur gas fees and RAILGUN shielding/unshielding fees, even if the underlying swap fails.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "I understand",
          onPress: async () => {
            await StorageService.setItem(
              Constants.HAS_SHOWN_WARNING_FIRST_PRIVATE_SWAP,
              "1"
            );
            goToReviewOrder();
          },
        },
      ]
    );
  };

  return (
    <SharedSwapContent
      navigation={navigation}
      isRailgun={true}
      quote={quote}
      quoteError={recipeError}
      isLoadingQuote={isLoadingRecipeOutput}
      swapSettings={swapSettings}
      sellERC20Amount={sellERC20Amount}
      buyERC20={buyERC20}
      buyERC20Amount={buyERC20Amount}
      onTapReviewOrder={onTapReviewOrder}
      returnBackFromCompletedOrder={returnBackFromCompletedOrder}
      {...props}
    />
  );
};
