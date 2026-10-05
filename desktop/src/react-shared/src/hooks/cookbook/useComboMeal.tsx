import {
  ComboMeal,
  RecipeERC20Amount,
  RecipeInput,
  RecipeOutput,
} from '@railgun-community/cookbook';
import { delay, NFTAmount } from '@railgun-community/shared-models';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ERC20Amount } from '../../models';
import { generateKey, logDevError } from '../../utils';
import {
  compareERC20AmountArrays,
  compareNFTAmountArrays,
  createRailgunNFTAmounts,
} from '../../utils/tokens';
import { useReduxSelector } from '../hooks-redux';
import { useMemoCustomCompare } from '../react-extensions';

export const useComboMeal = <T extends ComboMeal>(
  comboMeal: Optional<T>,
  unshieldERC20Amounts: ERC20Amount[],
  unshieldNFTAmounts: NFTAmount[],
) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');

  const [currentComboMeal, setCurrentComboMeal] = useState<Optional<T>>();
  const [recipeOutput, setRecipeOutput] = useState<Optional<RecipeOutput>>();
  const [recipeError, setRecipeError] = useState<Optional<Error>>();
  const [isLoadingRecipeOutput, setIsLoadingRecipeOutput] =
    useState<boolean>(false);

  const latestComboMealRunID = useRef<Optional<string>>();

  const relayAdaptUnshieldERC20Amounts: ERC20Amount[] = useMemoCustomCompare(
    unshieldERC20Amounts,
    compareERC20AmountArrays,
  );
  const relayAdaptUnshieldNFTAmounts: NFTAmount[] = useMemoCustomCompare(
    unshieldNFTAmounts,
    compareNFTAmountArrays,
  );

  const recipeInput: RecipeInput = useMemo(() => {
    const erc20Amounts: RecipeERC20Amount[] =
      relayAdaptUnshieldERC20Amounts.map(erc20Amount => ({
        tokenAddress: erc20Amount.token.address,
        decimals: BigInt(erc20Amount.token.decimals),
        isBaseToken: erc20Amount.token.isBaseToken,
        amount: BigInt(erc20Amount.amountString),
      }));
    return {
      railgunAddress: wallets.active?.railAddress ?? 'No Active Wallet',
      networkName: network.current.name,
      erc20Amounts,
      nfts: createRailgunNFTAmounts(relayAdaptUnshieldNFTAmounts),
    };
  }, [
    network,
    relayAdaptUnshieldERC20Amounts,
    relayAdaptUnshieldNFTAmounts,
    wallets.active?.railAddress,
  ]);

  useEffect(() => {
    setRecipeError(undefined);
    setIsLoadingRecipeOutput(true);

    const currentComboMealRunID = generateKey(16);
    latestComboMealRunID.current = currentComboMealRunID;

    const updateComboMealOutput = async () => {
      await delay(500);
      if (currentComboMealRunID !== latestComboMealRunID.current) {
        return;
      }

      try {
        if (!comboMeal) {
          setIsLoadingRecipeOutput(false);
          return;
        }
        const output = await comboMeal.getComboMealOutput(recipeInput);
        if (currentComboMealRunID === latestComboMealRunID.current) {
          setCurrentComboMeal(comboMeal);
          setRecipeOutput(output);
        }
        setIsLoadingRecipeOutput(false);
      } catch (err) {
        const error = new Error('Error updating combo meal output', {
          cause: err,
        });
        logDevError(error);
        if (currentComboMealRunID === latestComboMealRunID.current) {
          setCurrentComboMeal(undefined);
          setRecipeOutput(undefined);
          setRecipeError(error);
        }
        setIsLoadingRecipeOutput(false);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    updateComboMealOutput();
  }, [comboMeal, recipeInput]);

  return {
    comboMeal: currentComboMeal,
    recipeOutput,
    recipeError,
    isLoadingRecipeOutput,
  };
};
