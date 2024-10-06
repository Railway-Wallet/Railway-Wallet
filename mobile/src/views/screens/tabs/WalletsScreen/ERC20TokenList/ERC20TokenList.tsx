import {
  MerkletreeScanStatus,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  AppSettingsService,
  createERC20TokenBalance,
  ERC20Token,
  ERC20TokenBalance,
  getTokensPendingBalances,
  MerkletreeScanCurrentStatus,
  MerkletreeType,
  sortTokensByBalance,
  tokenBalancesForWalletAndState,
  useAddedTokenSearch,
  useReduxSelector,
} from "@react-shared";
import { ERC20TokenListHeader } from "./ERC20TokenListHeader/ERC20TokenListHeader";
import { ERC20TokenListLoading } from "./ERC20TokenListLoading/ERC20TokenListLoading";
import { ERC20TokenListRow } from "./ERC20TokenListRow/ERC20TokenListRow";
import { styles } from "./styles";

type Props = {
  isRailgun: boolean;
  isRefreshing: boolean;
  onAddToken: () => void;
  onRefresh: () => void;
  onSelectToken: (token: ERC20Token) => void;
  onEnableDiscreetMode: () => void;
  onDisableDiscreetMode: () => void;
  tokenSearchText?: string;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const ERC20TokenList: React.FC<Props> = ({
  onAddToken,
  onRefresh,
  onSelectToken,
  onEnableDiscreetMode,
  onDisableDiscreetMode,
  isRailgun,
  isRefreshing,
  tokenSearchText,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { networkPrices } = useReduxSelector("networkPrices");
  const { erc20BalancesNetwork } = useReduxSelector("erc20BalancesNetwork");
  const { erc20BalancesRailgun } = useReduxSelector("erc20BalancesRailgun");
  const { merkletreeHistoryScan } = useReduxSelector("merkletreeHistoryScan");
  const { txidVersion } = useReduxSelector("txidVersion");
  const { discreetMode } = useReduxSelector("discreetMode");

  const [ERC20TokenBalances, setERC20TokenBalances] = useState<
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

  const utxoMerkletreeScanData: Optional<MerkletreeScanCurrentStatus> =
    merkletreeHistoryScan.forNetwork[network.current.name]?.forType[
      MerkletreeType.UTXO
    ];
  const railgunBalancesUpdating =
    utxoMerkletreeScanData?.status === MerkletreeScanStatus.Started ||
    utxoMerkletreeScanData?.status === MerkletreeScanStatus.Updated;
  const balanceScanProgress = utxoMerkletreeScanData?.progress ?? 0;

  const txidMerkletreeScanData: Optional<MerkletreeScanCurrentStatus> =
    merkletreeHistoryScan.forNetwork[network.current.name]?.forType[
      MerkletreeType.TXID
    ];
  const txidsUpdating =
    txidMerkletreeScanData?.status === MerkletreeScanStatus.Started ||
    txidMerkletreeScanData?.status === MerkletreeScanStatus.Updated;
  const txidScanProgress = txidMerkletreeScanData?.progress ?? 0;

  const currentTxidVersion = txidVersion.current;

  const tokensPendingBalances = useMemo(() => {
    return getTokensPendingBalances(
      activeWallet,
      railgunWalletBalances,
      currentTxidVersion,
      isRailgun
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
      balanceBucketFilter
    );

    const balances = tokens.map((token) =>
      createERC20TokenBalance(
        activeWallet,
        token,
        tokenBalances,
        tokenPrices,
        isRailgun
      )
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

  const renderTokenRow = (tokenBalance: ERC20TokenBalance, index: number) => {
    if ((tokenBalance.token.isBaseToken ?? false) && isRailgun) {
      return null;
    }

    return (
      <ERC20TokenListRow
        key={index}
        onSelect={() => onSelectToken(tokenBalance.token)}
        tokenBalance={tokenBalance}
        hasPendingBalance={tokensPendingBalances.includes(
          tokenBalance.token.address
        )}
      />
    );
  };

  return (
    <View style={styles.listWrapper}>
      <ERC20TokenListHeader
        onTapAddToken={onAddToken}
        isRailgun={isRailgun}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        discreet={discreetMode.enabled}
        onEnableDiscreetMode={onEnableDiscreetMode}
        onDisableDiscreetMode={onDisableDiscreetMode}
      />
      {railgunBalancesUpdating && isRailgun && (
        <ERC20TokenListLoading
          title={"RAILGUN balances updating"}
          progress={balanceScanProgress}
        />
      )}
      {!railgunBalancesUpdating && txidsUpdating && isRailgun && (
        <ERC20TokenListLoading
          title={"RAILGUN TXIDs updating"}
          progress={txidScanProgress}
        />
      )}
      {ERC20TokenBalances.map(renderTokenRow)}
    </View>
  );
};
