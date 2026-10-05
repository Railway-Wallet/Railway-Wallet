import { useEffect, useState } from 'react';
import axios from 'axios';
import { logDevError } from '../../utils/logging';

const MORPHO_API_URL = 'https://api.morpho.org/graphql';
const MAINNET_CHAIN_ID = 1;

const VAULTS_QUERY = `
query RailwayMorphoVaults {
  vaults(
    first: 100
    orderBy: TotalAssetsUsd
    orderDirection: Desc
    where: { chainId_in: [${MAINNET_CHAIN_ID}] }
  ) {
    items {
      address
      name
      asset { address decimals symbol }
      state { totalAssetsUsd netApy }
    }
  }
}`;

export type MorphoVaultListItem = {
  vaultAddress: string;
  name: string;
  assetAddress: string;
  assetDecimals: number;
  assetSymbol: string;
  tvlUsd: number;
  netApy: number;
};

type ApiAsset = { address: string; decimals: number; symbol: string | null };
type ApiVault = {
  address: string;
  name: string | null;
  asset: ApiAsset | null;
  state: { totalAssetsUsd: number | null; netApy: number | null } | null;
};
type VaultsResponse = {
  data?: { vaults?: { items?: ApiVault[] } };
  errors?: { message: string }[];
};

export const useMorphoVaultList = (enabled: boolean) => {
  const [vaults, setVaults] = useState<MorphoVaultListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<Error>>();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(undefined);
    const run = async () => {
      try {
        const response = await axios.post<VaultsResponse>(
          MORPHO_API_URL,
          { query: VAULTS_QUERY },
          { headers: { 'Content-Type': 'application/json' } },
        );
        const body = response.data;
        if (isDefinedErrors(body.errors)) {
          throw new Error(body.errors[0].message);
        }
        const items = body.data?.vaults?.items ?? [];
        const mapped: MorphoVaultListItem[] = items.flatMap(vault => {
          if (vault.asset === null || vault.asset.symbol === null) {
            return [];
          }
          return [
            {
              vaultAddress: vault.address,
              name: vault.name ?? 'Morpho Vault',
              assetAddress: vault.asset.address,
              assetDecimals: vault.asset.decimals,
              assetSymbol: vault.asset.symbol,
              tvlUsd: vault.state?.totalAssetsUsd ?? 0,
              netApy: vault.state?.netApy ?? 0,
            },
          ];
        });
        if (!cancelled) {
          setVaults(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          logDevError(
            new Error('Failed to fetch Morpho vault list', { cause: err }),
          );
          setError(
            new Error(
              'Could not load the Morpho vault list. Check your connection and try again.',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { vaults, isLoading, error };
};

const isDefinedErrors = (
  errors: VaultsResponse['errors'],
): errors is { message: string }[] => errors !== undefined && errors.length > 0;
