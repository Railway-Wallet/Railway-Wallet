import { SwapQuoteData } from "@railgun-community/cookbook";
import { useMemo } from "react";
import { SharedConstants } from "../../config/shared-constants";

export const useSwapQuoteSignificantlyChanged = (
  lockedQuote: SwapQuoteData,
  currentQuote: Optional<SwapQuoteData>
) => {
  const quoteSignificantlyChanged = useMemo(() => {
    if (!currentQuote) {
      return false;
    }

    const priceQuotient = (lockedQuote.price * 10000n) / currentQuote.price;
    const outOfDateBasisPoints =
      SharedConstants.ZERO_X_QUOTE_OUT_OF_DATE_BASIS_POINTS;
    const lowerBound: bigint = 10000n - outOfDateBasisPoints;
    const upperBound: bigint = 10000n + outOfDateBasisPoints;
    const priceChangedSignificantly =
      priceQuotient < lowerBound || priceQuotient > upperBound;
    return priceChangedSignificantly;
  }, [currentQuote, lockedQuote]);

  return { quoteSignificantlyChanged };
};
