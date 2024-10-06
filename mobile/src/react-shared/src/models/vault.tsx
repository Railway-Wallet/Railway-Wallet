export enum VaultType {
  Beefy = "Beefy",
}

export type Vault = {
  name: string;
  id: Optional<string>;
  type: VaultType;
  depositERC20Symbol: string;
  depositERC20Address: string;
  depositERC20Decimals: number;
  redeemERC20Symbol: string;
  redeemERC20Address: string;
  redeemERC20Decimals: number;
  apy: number;
  vaultRate: string;
};
