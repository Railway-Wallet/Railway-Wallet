import { useState } from "react";
import { ERC20Amount } from "../../models/token";
import { compareERC20Amounts } from "../../utils/tokens";

export const useUpdatingERC20Amount = (initialValue?: ERC20Amount) => {
  const [currentERC20Amount, setCurrentERC20Amount] =
    useState<Optional<ERC20Amount>>(initialValue);

  const onERC20AmountUpdate = (erc20Amount: Optional<ERC20Amount>) => {
    if (compareERC20Amounts(erc20Amount, currentERC20Amount)) {
      return;
    }
    setCurrentERC20Amount(erc20Amount);
  };

  return { currentERC20Amount, onERC20AmountUpdate };
};
