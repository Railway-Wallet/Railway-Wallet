export enum CookbookGeneralRecipeType {
  UnshieldTransferBaseToken = "UnshieldTransferBaseToken",
}

export enum CookbookSwapRecipeType {
  ZeroX = "ZeroX",
}

export enum CookbookFarmRecipeType {
  Deposit = "Deposit",
  Redeem = "Redeem",
}

export enum CookbookLiquidityRecipeType {
  AddLiquidity = "AddLiquidity",
  RemoveLiquidity = "RemoveLiquidity",
}

export type CookbookRecipeType =
  | CookbookGeneralRecipeType
  | CookbookSwapRecipeType
  | CookbookFarmRecipeType
  | CookbookLiquidityRecipeType;
