import {
  RecipeERC20Amount,
  RecipeERC20Info,
  SwapQuoteDataV2,
  ZeroXV2Quote,
  ZeroXV2SwapRecipe,
} from '@railgun-community/cookbook';
import { NetworkName } from '@railgun-community/shared-models';

export class Ephemeral7702ZeroXV2SwapRecipe extends ZeroXV2SwapRecipe {
  private readonly ephemeralTakerAddress: string;
  private readonly buyERC20InfoFor7702: RecipeERC20Info;
  private readonly slippageBasisPointsFor7702: number;

  constructor(
    sellERC20Info: RecipeERC20Info,
    buyERC20Info: RecipeERC20Info,
    slippageBasisPoints: number,
    destinationAddress: Optional<string>,
    ephemeralTakerAddress: string,
  ) {
    super(
      sellERC20Info,
      buyERC20Info,
      slippageBasisPoints,
      ephemeralTakerAddress,
      destinationAddress,
    );
    this.ephemeralTakerAddress = ephemeralTakerAddress;
    this.buyERC20InfoFor7702 = buyERC20Info;
    this.slippageBasisPointsFor7702 = slippageBasisPoints;
  }

  getSwapQuote(
    networkName: NetworkName,
    sellERC20Amount: RecipeERC20Amount,
  ): Promise<SwapQuoteDataV2> {
    return ZeroXV2Quote.getSwapQuote({
      networkName,
      sellERC20Amount,
      buyERC20Info: this.buyERC20InfoFor7702,
      slippageBasisPoints: this.slippageBasisPointsFor7702,
      isRailgun: false,
      recipient: this.ephemeralTakerAddress,
    });
  }
}
