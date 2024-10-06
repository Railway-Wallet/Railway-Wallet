import {
  GetSwapQuote,
  RecipeERC20Amount,
  RecipeERC20Info,
  SwapQuoteData,
} from "@railgun-community/cookbook";
import { delay } from "@railgun-community/shared-models";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ERC20Amount, ERC20Token } from "../../models/token";
import { logDevError } from "../../utils";
import { generateKey, getSlippageBasisPoints } from "../../utils/util";
import { useReduxSelector } from "../hooks-redux";

export const usePublicSwapQuote = (
  sellERC20Amount: Optional<ERC20Amount>,
  buyERC20: Optional<ERC20Token>,
  slippagePercentage: number,
  getSwapQuote: GetSwapQuote
) => {
  const { network } = useReduxSelector("network");

  const [quote, setQuote] = useState<Optional<SwapQuoteData>>();
  const [quoteError, setQuoteError] = useState<Optional<Error>>();
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const latestQuoteID = useRef<Optional<string>>();
  const slippageBasisPoints = useMemo(
    () => getSlippageBasisPoints(slippagePercentage),
    [slippagePercentage]
  );

  const getQuote = useCallback(
    async (deleteCurrentQuote = true) => {
      if (deleteCurrentQuote) {
        setQuote(undefined);
      }
      if (!sellERC20Amount || !buyERC20) {
        return;
      }
      const currentQuoteID = generateKey();
      latestQuoteID.current = currentQuoteID;
      setIsLoadingQuote(true);

      const sellRecipeERC20Amount: RecipeERC20Amount = {
        tokenAddress: sellERC20Amount.token.address,
        decimals: BigInt(sellERC20Amount.token.decimals),
        isBaseToken: sellERC20Amount.token.isBaseToken,
        amount: BigInt(sellERC20Amount.amountString),
      };
      const buyERC20Info: RecipeERC20Info = {
        tokenAddress: buyERC20.address,
        isBaseToken: buyERC20.isBaseToken,
        decimals: BigInt(buyERC20.decimals),
      };

      try {
        await delay(500);
        if (currentQuoteID !== latestQuoteID.current) {
          return;
        }

        const quote = await getSwapQuote({
          networkName: network.current.name,
          sellERC20Amount: sellRecipeERC20Amount,
          buyERC20Info,
          slippageBasisPoints,
          isRailgun: false,
        });
        if (currentQuoteID === latestQuoteID.current) {
          setQuote(quote);
          setQuoteError(undefined);
          setIsLoadingQuote(false);
        }
      } catch (err) {
        const error = new Error("Error getting swap quote", { cause: err });
        logDevError(error);
        if (currentQuoteID === latestQuoteID.current) {
          setQuote(undefined);
          setQuoteError(error);
          setIsLoadingQuote(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      buyERC20,
      network,
      sellERC20Amount?.token,
      sellERC20Amount?.amountString,
      slippageBasisPoints,
    ]
  );

  useEffect(() => {
    setQuote(undefined);
  }, [sellERC20Amount?.token]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    buyERC20,
    network,
    sellERC20Amount?.token,
    sellERC20Amount?.amountString,
    slippagePercentage,
  ]);

  return { quote, quoteError, isLoadingQuote };
};
