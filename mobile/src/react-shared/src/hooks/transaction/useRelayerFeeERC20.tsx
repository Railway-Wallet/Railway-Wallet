import { RailgunWalletBalanceBucket } from '@railgun-community/shared-models';
import { useState } from 'react';
import { DEFAULT_WALLET_TOKENS_FOR_NETWORK } from '../../models/default-tokens';
import { ERC20Amount, ERC20Token } from '../../models/token';
import { AppSettingsService } from '../../services';
import { getTopTokenForWallet } from '../../services/wallet/wallet-balance-service';
import { useReduxSelector } from '../hooks-redux';

export const useRelayerFeeERC20 = (tokenAmounts: ERC20Amount[]) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkPrices } = useReduxSelector('networkPrices');
  const { erc20BalancesRailgun } = useReduxSelector('erc20BalancesRailgun');
  const { txidVersion } = useReduxSelector('txidVersion');

  const railgunWalletBalances =
    erc20BalancesRailgun.forNetwork[network.current.name];
  const tokenPrices =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];
  const skippedTokens: ERC20Token[] = [];
  const isRailgun = true;

  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];

  const topToken = getTopTokenForWallet(
    wallets.active,
    network.current.name,
    undefined, railgunWalletBalances,
    tokenPrices,
    skippedTokens,
    isRailgun,
    txidVersion.current,
    balanceBucketFilter,
  );
  const firstSelectedToken = () =>
    tokenAmounts.length ? tokenAmounts[0].token : undefined;

  const firstAddedToken = () => {
    const addedTokens = wallets.active?.addedTokens[network.current.name];
    return addedTokens && addedTokens.length ? addedTokens[0] : undefined;
  };

  const [selectedFeeToken, setSelectedFeeToken] = useState<ERC20Token>(
    topToken ??
      firstSelectedToken() ??
      firstAddedToken() ??
      DEFAULT_WALLET_TOKENS_FOR_NETWORK[network.current.name][0],
  );
  const [showRelayerFeeERC20Modal, setShowRelayerFeeERC20Modal] =
    useState(false);

  const selectRelayerFeeERC20Modal = () => {
    setShowRelayerFeeERC20Modal(true);
  };

  const onDismissSelectRelayerFee = (token?: ERC20Token) => {
    if (token) {
      setSelectedFeeToken(token);
    }
    setShowRelayerFeeERC20Modal(false);
  };

  return {
    selectedFeeToken,
    selectRelayerFeeERC20Modal,
    showRelayerFeeERC20Modal,
    onDismissSelectRelayerFee,
  };
};
