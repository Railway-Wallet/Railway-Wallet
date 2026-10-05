import {
  KNOWN_METAMORPHO_VAULTS,
  KNOWN_MORPHO_VAULTS_V2,
  MorphoVaultVersion,
} from '@railgun-community/cookbook';

export type KnownMorphoVault = {
  name: string;
  vaultAddress: string;
  assetAddress: string;
  assetDecimals: number;
  version: MorphoVaultVersion;
};

export const getKnownMorphoVaults = (): KnownMorphoVault[] => {
  const v1 = Object.values(KNOWN_METAMORPHO_VAULTS).map(vault => ({
    name: vault.name,
    vaultAddress: vault.vaultAddress,
    assetAddress: vault.assetAddress,
    assetDecimals: Number(vault.assetDecimals),
    version: 'V1' as MorphoVaultVersion,
  }));
  const v2 = Object.values(KNOWN_MORPHO_VAULTS_V2).map(vault => ({
    name: vault.name,
    vaultAddress: vault.vaultAddress,
    assetAddress: vault.assetAddress,
    assetDecimals: Number(vault.assetDecimals),
    version: 'V2' as MorphoVaultVersion,
  }));
  return [...v1, ...v2];
};
