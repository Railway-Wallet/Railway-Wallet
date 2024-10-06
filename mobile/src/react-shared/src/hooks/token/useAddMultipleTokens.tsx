import { compareTokenAddress } from "@railgun-community/cookbook";
import { isDefined } from "@railgun-community/shared-models";
import { useEffect, useState } from "react";
import { SearchableERC20 } from "../../models";

export const useAddMultipleTokens = (
  tokensToAdd: Optional<SearchableERC20[]>
) => {
  const [currentTokenToAdd, setCurrentTokenToAdd] =
    useState<Optional<SearchableERC20>>();

  useEffect(() => {
    if (tokensToAdd && tokensToAdd?.length > 0) {
      setCurrentTokenToAdd(tokensToAdd[0]);
    }
  }, [tokensToAdd]);

  const onTokenAddSuccess = (tokenAddress: string) => {
    const addedTokenIndex = tokensToAdd?.findIndex((token) =>
      compareTokenAddress(token.address, tokenAddress)
    );
    if (isDefined(addedTokenIndex)) {
      const newTokenToAdd = tokensToAdd?.[addedTokenIndex + 1] ?? undefined;
      setCurrentTokenToAdd(newTokenToAdd);
    }
    setCurrentTokenToAdd(undefined);
  };

  return { currentTokenToAdd, setCurrentTokenToAdd, onTokenAddSuccess };
};
