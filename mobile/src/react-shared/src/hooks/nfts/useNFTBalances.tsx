import {
  NFTAmount,
  NFTTokenType,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { FrontendWallet } from "../../models/wallet";
import { NFTBalanceState } from "../../redux-store/reducers/nft-balance-reducer-network";
import { RailgunNFTBalanceState } from "../../redux-store/reducers/nft-balance-reducer-railgun";
import { getRailgunNFTAmountsFromTXIDBalanceMap } from "../../services/wallet/wallet-balance-service";
import { useReduxSelector } from "../hooks-redux";

export type NFTData = {
  public: Optional<NFTAmount[]>;
  shielded: Optional<NFTAmount[]>;
};

const SUPPORTED_NFT_TOKEN_TYPES: NFTTokenType[] = [NFTTokenType.ERC721];

export const useNFTBalances = (
  wallet: Optional<FrontendWallet>,
  balanceBucketFilter: RailgunWalletBalanceBucket[]
): { nftBalances: Optional<NFTData> } => {
  const { network } = useReduxSelector("network");
  const { nftBalancesNetwork } = useReduxSelector("nftBalancesNetwork");
  const { nftBalancesRailgun } = useReduxSelector("nftBalancesRailgun");
  const { txidVersion } = useReduxSelector("txidVersion");

  if (!wallet) {
    return { nftBalances: undefined };
  }

  const nftsForBalances = (
    balances: NFTBalanceState,
    balancesID: string
  ): Optional<NFTAmount[]> => {
    return balances.forNetwork[network.current.name]?.forWallet[
      balancesID
    ]?.filter((nft) => {
      return SUPPORTED_NFT_TOKEN_TYPES.includes(nft.nftTokenType);
    });
  };

  const nftsForBalancesRailgun = (
    balances: RailgunNFTBalanceState,
    balancesID: string
  ): Optional<NFTAmount[]> => {
    let nftAmounts: NFTAmount[] = [];

    const nftAmountsMap =
      balances.forNetwork[network.current.name]?.forWallet[balancesID];

    if (nftAmountsMap) {
      nftAmounts = getRailgunNFTAmountsFromTXIDBalanceMap(
        nftAmountsMap,
        txidVersion.current,
        balanceBucketFilter
      );
    }
    return nftAmounts.filter((nft) => {
      return SUPPORTED_NFT_TOKEN_TYPES.includes(nft.nftTokenType);
    });
  };

  const nftBalances: NFTData = {
    shielded: nftsForBalancesRailgun(nftBalancesRailgun, wallet.railWalletID),
    public: nftsForBalances(nftBalancesNetwork, wallet.id),
  };

  return { nftBalances };
};
