import { isDefined } from '@railgun-community/shared-models';
import {
  CookbookSwapRecipeType,
  ERC20Amount,
  StorageService,
  useSwapRecipe,
} from '@react-shared';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  SwapPrivateData,
} from '../../../../models/drawer-types';
import { drawerEventsBus } from '../../../../services/navigation/drawer-events';
import { Constants } from '../../../../utils/constants';
import { SharedSwapContent, SwapContentProps } from './SharedSwapContent';

export const ZeroXPrivateSwapContent: React.FC<SwapContentProps> = ({
  setAlert,
  swapSettings,
  sellERC20Amount,
  buyERC20,
  ...props
}: SwapContentProps) => {
  const swapRecipeType = CookbookSwapRecipeType.ZeroX;

  const { quote, recipeError, isLoadingRecipeOutput, recipe, recipeOutput } =
    useSwapRecipe(
      swapRecipeType,
      sellERC20Amount,
      buyERC20,
      swapSettings.slippagePercentage,
      undefined,
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
    if (
      !isDefined(sellERC20Amount) ||
      !isDefined(buyERC20) ||
      !quote ||
      !recipe ||
      !recipeOutput
    ) {
      return;
    }
    const extraData: SwapPrivateData = {
      originalQuote: quote,
      originalRecipe: recipe,
      originalRecipeOutput: recipeOutput,
      swapRecipeType,
      sellERC20Amount,
      buyERC20,
      originalSlippagePercentage: swapSettings.slippagePercentage,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.SwapPrivate,
      extraData,
    });
  };

  const onTapReviewOrder = async () => {
    if (!sellERC20Amount || !buyERC20 || !quote) {
      return;
    }
    const hasShownWarningFirstPrivateSwap = await StorageService.getItem(
      Constants.HAS_SHOWN_WARNING_FIRST_PRIVATE_SWAP,
    );
    if (!isDefined(hasShownWarningFirstPrivateSwap)) {
      showFirstPrivateSwapWarning();
      return;
    }
    goToReviewOrder();
  };

  const showFirstPrivateSwapWarning = () => {
    setAlert({
      title: 'WARNING: Private Swaps',
      message:
        'Do not use the RAILGUN system for private swaps if the slippage is likely to be above 2%, ie. for tokens with volatile prices or low liquidity. \n\nFor volatile tokens, multiple smaller trades will ensure safety. \n\nPlease note that private DEX transactions incur gas fees and RAILGUN shielding/unshielding fees, even if the underlying swap fails.',
      onClose: () => setAlert(undefined),
      submitTitle: 'I understand',
      onSubmit: async () => {
        await StorageService.setItem(
          Constants.HAS_SHOWN_WARNING_FIRST_PRIVATE_SWAP,
          '1',
        );
        goToReviewOrder();
        setAlert(undefined);
      },
    });
  };

  return (
    <SharedSwapContent
      isRailgun={true}
      quote={quote}
      quoteError={recipeError}
      isLoadingQuote={isLoadingRecipeOutput}
      swapSettings={swapSettings}
      sellERC20Amount={sellERC20Amount}
      buyERC20={buyERC20}
      buyERC20Amount={buyERC20Amount}
      setAlert={setAlert}
      onTapReviewOrder={onTapReviewOrder}
      {...props}
    />
  );
};
