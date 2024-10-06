import {
  BeefyDepositRecipe,
  BeefyWithdrawRecipe,
  Recipe,
  RecipeERC20Info,
} from "@railgun-community/cookbook";
import { isDefined } from "@railgun-community/shared-models";
import { useMemo } from "react";
import { CookbookFarmRecipeType } from "../../models/cookbook";
import { ERC20Amount } from "../../models/token";
import { Vault, VaultType } from "../../models/vault";
import { compareRecipeERC20Info, getRecipeERC20Info } from "../../utils";
import { useMemoCustomCompare } from "../react-extensions";
import { useRecipe } from "./useRecipe";

export const useVaultRecipe = (
  farmRecipeType: CookbookFarmRecipeType,
  vault: Vault,
  transferERC20Amount: Optional<ERC20Amount>
) => {
  const transferERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    transferERC20Amount
      ? getRecipeERC20Info(transferERC20Amount.token)
      : undefined,
    compareRecipeERC20Info
  );

  const vaultRecipe: Optional<Recipe> = useMemo(() => {
    if (!isDefined(vault.id) || !isDefined(transferERC20Info)) {
      return undefined;
    }
    switch (farmRecipeType) {
      case CookbookFarmRecipeType.Deposit:
        switch (vault.type) {
          case VaultType.Beefy:
            return new BeefyDepositRecipe(vault.id);
        }
        return;
      case CookbookFarmRecipeType.Redeem:
        switch (vault.type) {
          case VaultType.Beefy:
            return new BeefyWithdrawRecipe(vault.id);
        }
        return;
    }
  }, [vault, farmRecipeType, transferERC20Info]);

  const unshieldERC20Amounts = transferERC20Amount ? [transferERC20Amount] : [];
  const { recipe, recipeError, recipeOutput, isLoadingRecipeOutput } =
    useRecipe(vaultRecipe, unshieldERC20Amounts, []);

  return {
    recipe,
    recipeError,
    recipeOutput,
    isLoadingRecipeOutput,
  };
};
