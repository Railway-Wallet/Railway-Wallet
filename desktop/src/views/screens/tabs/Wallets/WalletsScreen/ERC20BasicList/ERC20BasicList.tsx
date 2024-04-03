import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import {
  DrawerName,
  ERC20InfoData,
  EVENT_OPEN_DRAWER_WITH_DATA,
} from '@models/drawer-types';
import {
  AppSettingsService,
  createERC20TokenBalance,
  ERC20Token,
  ERC20TokenBalance,
  getTokensPendingBalances,
  sortTokensByBalance,
  tokenBalancesForWalletAndState,
  useAddedTokenSearch,
  useReduxSelector,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { ERC20BasicListRow } from './ERC20BasicListRow/ERC20BasicListRow';

type Props = {
  isRailgun: boolean;
  tokenSearchText: string;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const ERC20BasicList = ({
  isRailgun,
  tokenSearchText,
  balanceBucketFilter,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkPrices } = useReduxSelector('networkPrices');
  const { erc20BalancesNetwork } = useReduxSelector('erc20BalancesNetwork');
  const { erc20BalancesRailgun } = useReduxSelector('erc20BalancesRailgun');
  const { txidVersion } = useReduxSelector('txidVersion');

  const [walletTokenBalances, setERC20TokenBalances] = useState<
    ERC20TokenBalance[]
  >([]);

  const activeWallet = wallets.active;

  const { tokens } = useAddedTokenSearch(tokenSearchText);

  const networkWalletBalances =
    erc20BalancesNetwork.forNetwork[network.current.name];
  const railgunWalletBalances =
    erc20BalancesRailgun.forNetwork[network.current.name];
  const tokenPrices =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];
  const currentTxidVersion = txidVersion.current;

  const tokensPendingBalances = useMemo(() => {
    return getTokensPendingBalances(
      activeWallet,
      railgunWalletBalances,
      currentTxidVersion,
      isRailgun,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeWallet?.railWalletID,
    railgunWalletBalances,
    currentTxidVersion,
    isRailgun,
  ]);

  useEffect(() => {
    const tokenBalances = tokenBalancesForWalletAndState(
      activeWallet,
      networkWalletBalances,
      railgunWalletBalances,
      isRailgun,
      currentTxidVersion,
      balanceBucketFilter,
    );

    const balances = tokens.map(token =>
      createERC20TokenBalance(
        activeWallet,
        token,
        tokenBalances,
        tokenPrices,
        isRailgun,
      ),
    );

    const sortedERC20TokenBalances = sortTokensByBalance(balances);
    setERC20TokenBalances(sortedERC20TokenBalances);
  }, [
    activeWallet,
    tokens,
    networkWalletBalances,
    railgunWalletBalances,
    tokenPrices,
    network.current.name,
    isRailgun,
    balanceBucketFilter,
    currentTxidVersion,
  ]);

  const onSelectERC20 = (token: ERC20Token) => {
    if (!isDefined(token)) {
      return;
    }
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.ERC20Info,
      extraData: { erc20: token, balanceBucketFilter } as ERC20InfoData,
    });
  };

  const createERC20BasicListRow = (
    tokenBalance: ERC20TokenBalance,
    index: number,
  ) => {
    if ((tokenBalance.token.isBaseToken ?? false) && isRailgun) {
      return null;
    }

    return (
      <ERC20BasicListRow
        key={index}
        onSelect={() => onSelectERC20(tokenBalance.token)}
        tokenBalance={tokenBalance}
        hasPendingBalance={tokensPendingBalances.includes(
          tokenBalance.token.address,
        )}
      />
    );
  };

  return (
    <MainPagePaddedContainer>
      {walletTokenBalances.map(createERC20BasicListRow)}
    </MainPagePaddedContainer>
  );
};
