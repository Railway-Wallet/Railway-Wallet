import { GetSwapQuote, SwapQuoteData } from "@railgun-community/cookbook";
import { useRef, useState } from "react";
import { ERC20Amount, ERC20Token } from "../../models/token";
import { usePublicSwapQuote } from "./usePublicSwapQuote";
import { useSwapQuoteSignificantlyChanged } from "./useSwapQuoteSignificantlyChanged";

export const useUpdatingPublicSwapQuote = (
  originalQuote: SwapQuoteData,
  sellERC20Amount: Optional<ERC20Amount>,
  buyERC20: ERC20Token,
  slippagePercentage: number,
  getSwapQuote: GetSwapQuote
) => {
  const [lockedQuote, setLockedQuote] = useState<SwapQuoteData>(originalQuote);

  const currentQuoteSellERC20Amount = useRef(sellERC20Amount);
  const sellAmountChanged =
    sellERC20Amount?.amountString !==
    currentQuoteSellERC20Amount.current?.amountString;

  const { quote: currentQuote } = usePublicSwapQuote(
    sellERC20Amount,
    buyERC20,
    slippagePercentage,
    getSwapQuote
  );

  const { quoteSignificantlyChanged } = useSwapQuoteSignificantlyChanged(
    lockedQuote,
    currentQuote
  );

  const updateCurrentLockedQuote = () => {
    if (!currentQuote) {
      return;
    }
    currentQuoteSellERC20Amount.current = sellERC20Amount;
    setLockedQuote(currentQuote);
  };

  return {
    lockedQuote,
    updateQuote: updateCurrentLockedQuote,
    quoteOutdated: quoteSignificantlyChanged || sellAmountChanged,
  };
};
