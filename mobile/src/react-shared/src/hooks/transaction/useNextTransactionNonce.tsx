import { useEffect, useState } from "react";
import { AvailableWallet } from "../../models/wallet";
import { ProviderService } from "../../services/providers/provider-service";
import { NonceStorageService } from "../../services/wallet/nonce-storage-service";
import { useReduxSelector } from "../hooks-redux";

export const useNextTransactionNonce = (
  fromWalletAddress: string,
  isShieldedFromAddress: boolean,
  publicWalletOverride: Optional<AvailableWallet>
) => {
  const { network } = useReduxSelector("network");

  const [nextTransactionNonce, setNextTransactionNonce] =
    useState<Optional<number>>();

  useEffect(() => {
    const getNextTransactionNonce = async () => {
      if (!publicWalletOverride && isShieldedFromAddress) {
        setNextTransactionNonce(undefined);
        return;
      }
      const ethAddress = publicWalletOverride?.ethAddress ?? fromWalletAddress;
      const provider = await ProviderService.getProvider(network.current.name);
      const nonceStorageService = new NonceStorageService();
      const nonce = await nonceStorageService.getNextTransactionNonce(
        provider,
        ethAddress,
        network.current.name,
        undefined
      );
      setNextTransactionNonce(nonce);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getNextTransactionNonce();
  }, [fromWalletAddress, isShieldedFromAddress, network, publicWalletOverride]);

  return { nextTransactionNonce };
};
