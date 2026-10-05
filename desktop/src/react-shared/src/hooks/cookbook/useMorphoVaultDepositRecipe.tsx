import {
  MorphoVaultVersion,
  RecipeERC20Info,
  ZeroXConfig,
  ZeroXSwap_MorphoVaultDeposit_ComboMeal,
} from '@railgun-community/cookbook';
import { isDefined, NetworkName } from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import { Provider } from 'ethers';
import { ERC20Amount } from '../../models/token';
import { ProviderService } from '../../services/providers/provider-service';
import {
  compareRecipeERC20Info,
  getRecipeERC20Info,
  getSlippageBasisPoints,
} from '../../utils';
import { logDevError } from '../../utils/logging';
import { useReduxSelector } from '../hooks-redux';
import { useMemoCustomCompare } from '../react-extensions';
import { useComboMeal } from './useComboMeal';

export type { MorphoVaultVersion } from '@railgun-community/cookbook';

const MORPHO_NETWORK = NetworkName.Ethereum;

export const useMorphoVaultDepositRecipe = (
  vaultAddress: Optional<string>,
  vaultVersion: MorphoVaultVersion,
  assetAddress: Optional<string>,
  assetDecimals: Optional<number>,
  sellERC20Amount: Optional<ERC20Amount>,
  slippagePercentage: number,
  ephemeralAddress: Optional<string>,
) => {
  const { network } = useReduxSelector('network');
  const { remoteConfig } = useReduxSelector('remoteConfig');
  const networkName = network.current.name;
  const isSupported = networkName === MORPHO_NETWORK;

  ZeroXConfig.PROXY_API_DOMAIN = remoteConfig.current?.proxyApiUrl;

  const [provider, setProvider] = useState<Optional<Provider>>();

  useEffect(() => {
    if (!isSupported) {
      setProvider(undefined);
      return;
    }
    let cancelled = false;
    const resolve = async () => {
      try {
        const p = await ProviderService.getProvider(networkName);
        if (!cancelled) {
          setProvider(p);
        }
      } catch (err) {
        if (!cancelled) {
          logDevError(
            new Error('Failed to resolve provider for Morpho deposit', {
              cause: err,
            }),
          );
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    resolve();
    return () => {
      cancelled = true;
    };
  }, [networkName, isSupported]);

  const slippageBasisPoints = useMemo(
    () => parseInt(getSlippageBasisPoints(slippagePercentage).toString(), 10),
    [slippagePercentage],
  );

  const sellERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    sellERC20Amount ? getRecipeERC20Info(sellERC20Amount.token) : undefined,
    compareRecipeERC20Info,
  );

  const buyERC20Info: Optional<RecipeERC20Info> = useMemoCustomCompare(
    isDefined(assetAddress) && isDefined(assetDecimals)
      ? {
          tokenAddress: assetAddress,
          decimals: BigInt(assetDecimals),
          isBaseToken: false,
        }
      : undefined,
    compareRecipeERC20Info,
  );

  const comboMeal: Optional<ZeroXSwap_MorphoVaultDeposit_ComboMeal> =
    useMemo(() => {
      if (
        !isDefined(vaultAddress) ||
        !sellERC20Info ||
        !buyERC20Info ||
        !isDefined(provider) ||
        !isDefined(ephemeralAddress)
      ) {
        return undefined;
      }
      return new ZeroXSwap_MorphoVaultDeposit_ComboMeal(
        sellERC20Info,
        buyERC20Info,
        slippageBasisPoints,
        vaultAddress,
        BigInt(slippageBasisPoints),
        ephemeralAddress,
        provider,
        vaultVersion,
      );
    }, [
      vaultAddress,
      vaultVersion,
      sellERC20Info,
      buyERC20Info,
      slippageBasisPoints,
      provider,
      ephemeralAddress,
    ]);

  const unshieldERC20Amounts = sellERC20Amount ? [sellERC20Amount] : [];
  const { recipeOutput, recipeError, isLoadingRecipeOutput } = useComboMeal(
    comboMeal,
    unshieldERC20Amounts,
    [],
  );

  return {
    recipeOutput,
    isLoading: isLoadingRecipeOutput,
    error: recipeError,
    isSupported,
  };
};
