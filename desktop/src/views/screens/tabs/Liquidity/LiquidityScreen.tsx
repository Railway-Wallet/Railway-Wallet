import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { Selector } from '@components/Selector/Selector';
import { Text } from '@components/Text/Text';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  LiquidityData,
} from '@models/drawer-types';
import {
  CookbookLiquidityRecipeType,
  ERC20Token,
  ERC20TokenFullInfo,
  filterTokensBySearchField,
  formatNumberToLocaleWithMinDecimals,
  FrontendLiquidityPair,
  getDecimalBalance,
  getFilteredLiquidityPairs,
  getLiquiditySourcesAndAssetsUrls,
  getTokenDisplayName,
  refreshRailgunBalances,
  styleguide,
  truncateStr,
  useAppDispatch,
  useBalancePriceRefresh,
  useERC20BalancesSerialized,
  useLiquidityFetch,
  useLiquidityPairsForWalletFilter,
  useLiquidityPairsSort,
  useLiquidityTokensSort,
  useReduxSelector,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { ERC20BasicListHeader } from '@screens/tabs/Wallets/WalletsScreen/ERC20BasicList/ERC20BasicListHeader/ERC20BasicListHeader';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { createExternalSiteAlert } from '@utils/alerts';
import { Button } from '@views/components/Button/Button';
import { Spinner } from '@views/components/loading/Spinner/Spinner';
import { ERC20ListRow } from '@views/components/TokenListRow/ERC20ListRow/ERC20ListRow';
import { LiquidityListRow } from '@views/components/TokenListRow/LiquidityListRow/LiquidityListRow';
import styles from './LiquidityScreen.module.scss';

export type LiquidityScreenState = {
  token?: ERC20TokenFullInfo;
  isAddLiquidity?: boolean;
};

const ADD_LABEL = 'Add liquidity';
const REMOVE_LABEL = 'Remove liquidity';

type Action = {
  label: string;
  value: CookbookLiquidityRecipeType;
};

export const LiquidityScreen: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { wallets } = useReduxSelector('wallets');
  const { network } = useReduxSelector('network');
  const state: Optional<LiquidityScreenState> = location.state;
  const networkName = network.current.name;
  const activeWallet = wallets.active;
  const useRailgunBalances = true;
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    useRailgunBalances,
    balanceBucketFilter,
  );
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const [tokenSearchText, setTokenSearchText] = useState('');
  const [selectedAction, setSelectedAction] = useState<Action>({
    label: ADD_LABEL,
    value: CookbookLiquidityRecipeType.AddLiquidity,
  });
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredPoolsForAddLiquidity, setFilteredPoolsForAddLiquidity] =
    useState<FrontendLiquidityPair[]>([]);
  const [
    filteredERC20TokensForRemoveLiquidity,
    setFilteredERC20TokensForRemoveLiquidity,
  ] = useState<ERC20Token[]>([]);

  useEffect(() => {
    if (isDefined(state)) {
      setTokenSearchText(state.token?.symbol ?? '');

      const isAddLiquidity = state.isAddLiquidity ?? false;
      setSelectedAction({
        label: isAddLiquidity ? ADD_LABEL : REMOVE_LABEL,
        value: isAddLiquidity
          ? CookbookLiquidityRecipeType.AddLiquidity
          : CookbookLiquidityRecipeType.RemoveLiquidity,
      });
    }
  }, [state]);

  const isRailgun = true;
  const { refreshLiquidityData, isLoading } = useLiquidityFetch();
  const { addedLiquidityTokens, supportedLiquidityPairs } =
    useLiquidityPairsForWalletFilter(activeWallet, networkName, isRailgun);
  const { sortedLiquidityPairs } = useLiquidityPairsSort(
    supportedLiquidityPairs,
    isRailgun,
  );
  const { sortedLiquidityTokens } = useLiquidityTokensSort(
    addedLiquidityTokens,
    isRailgun,
  );
  const { pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      }),
  );

  const actions = [
    { label: ADD_LABEL, value: CookbookLiquidityRecipeType.AddLiquidity },
    { label: REMOVE_LABEL, value: CookbookLiquidityRecipeType.RemoveLiquidity },
  ];

  useEffect(() => {
    if (!isLoading) {
      switch (selectedAction.value) {
        case CookbookLiquidityRecipeType.AddLiquidity:
          setFilteredPoolsForAddLiquidity(
            getFilteredLiquidityPairs(sortedLiquidityPairs, tokenSearchText),
          );
          break;

        case CookbookLiquidityRecipeType.RemoveLiquidity:
          setFilteredERC20TokensForRemoveLiquidity(
            filterTokensBySearchField(
              sortedLiquidityTokens,
              tokenSearchText?.toLowerCase(),
            ),
          );
          break;
      }
    }
  }, [
    sortedLiquidityTokens,
    isLoading,
    selectedAction.value,
    sortedLiquidityPairs,
    supportedLiquidityPairs,
    tokenSearchText,
  ]);

  if (activeWallet?.isViewOnlyWallet ?? false) {
    return <Text>Not available for View-Only wallets</Text>;
  }

  const refreshBalancesAndPools = async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    await refreshLiquidityData(
      network.current.name,
      wallets?.active?.addedTokens[network.current.name] ?? [],
    );

    await pullBalances();
    setIsRefreshing(false);
  };

  const onSelectAddLiquidityPool = (pool: FrontendLiquidityPair) => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.Liquidity,
      extraData: {
        pool,
        cookbookLiquidityRecipeType: selectedAction.value,
      } as LiquidityData,
    });
  };

  const renderAddLiquidityPool = (
    pool: FrontendLiquidityPair,
    index: number,
  ) => {
    const { tokenA, tokenB } = pool;
    return (
      <LiquidityListRow
        key={index}
        tokens={[tokenA, tokenB]}
        onSelect={() => onSelectAddLiquidityPool(pool)}
      />
    );
  };

  const rightBalancesRemoveLiquidityERC20 = (token: ERC20Token) => {
    const balance = tokenBalancesSerialized[token.address.toLowerCase()];
    const hasBalance = isDefined(balance);

    if (!hasBalance || !balance) {
      return (
        <div className={styles.tokenSpinnerContainer}>
          <Spinner size={22} />
        </div>
      );
    }

    const balanceDecimal = getDecimalBalance(BigInt(balance), token.decimals);
    const balanceText = hasBalance
      ? balanceDecimal > 0 && balanceDecimal < 0.0001
        ? '<' + formatNumberToLocaleWithMinDecimals(0.0001, 4)
        : formatNumberToLocaleWithMinDecimals(balanceDecimal, 4)
      : undefined;

    return (
      <div className={styles.rightBalancesContainer}>
        <Text className={styles.rightBalancesText}>
          {truncateStr(balanceText, 12)}
        </Text>
      </div>
    );
  };

  const onSelectRemoveLiquidityERC20 = (
    token: ERC20Token,
    tokenName: string,
  ) => {
    const extraData: LiquidityData = {
      tokenAddress: token.address,
      tokenName: tokenName,
      cookbookLiquidityRecipeType: selectedAction.value,
    };

    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.Liquidity,
      extraData,
    });
  };

  const renderRemoveLiquidityERC20 = (token: ERC20Token, index: number) => {
    const tokenName = getTokenDisplayName(
      token,
      wallets.available,
      networkName,
    );
    return (
      <ERC20ListRow
        key={index}
        token={token}
        rightView={() => rightBalancesRemoveLiquidityERC20(token)}
        backgroundColor={styleguide.colors.gray6()}
        descriptionClassName={styles.descriptionStyle}
        onSelect={() => onSelectRemoveLiquidityERC20(token, tokenName)}
        description={tokenName}
      />
    );
  };

  const liquidityTypeSelector = (
    <Selector
      containerClassName={styles.liquidityTypeSelector}
      controlClassName={styles.liquidityTypeSelectorControl}
      options={actions}
      value={selectedAction}
      placeholder="Select action"
      onValueChange={option => setSelectedAction(option as Action)}
      testId="action-selector"
    />
  );

  const openUrl = (url: string) => {
    createExternalSiteAlert(url, setAlert, dispatch);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.spinnerContainer}>
          <Spinner size={40} />
        </div>
      );
    }
    if (
      filteredPoolsForAddLiquidity.length > 0 &&
      selectedAction.value === CookbookLiquidityRecipeType.AddLiquidity
    ) {
      return (
        <div className={styles.poolList}>
          {filteredPoolsForAddLiquidity.map(renderAddLiquidityPool)}
        </div>
      );
    }
    if (
      filteredERC20TokensForRemoveLiquidity.length > 0 &&
      selectedAction.value === CookbookLiquidityRecipeType.RemoveLiquidity
    ) {
      return (
        <div className={styles.poolList}>
          {filteredERC20TokensForRemoveLiquidity.map(
            renderRemoveLiquidityERC20,
          )}
        </div>
      );
    }
    return (
      <Text className={styles.placeholderText}>
        No liquidity pairs found in your private balance.
      </Text>
    );
  };

  return (
    <div className={cn(styles.pageContainer, 'hide-scroll')}>
      <MainPagePaddedContainer maxWidth={760} minWidth={700}>
        <div className={styles.content}>
          <div className={styles.headerRow}>
            <Text className={styles.headerText}>Liquidity</Text>
            <Text className={styles.headerSubtext}>
              Manage liquidity on decentralized exchanges
            </Text>
          </div>
          <div className={styles.liquidityContent}>
            <ERC20BasicListHeader
              isRailgun
              showAddTokens={false}
              customRightGroupStartView={liquidityTypeSelector}
              searchText={tokenSearchText}
              onSearchChange={setTokenSearchText}
              refreshBalances={refreshBalancesAndPools}
            />
            {renderContent()}
            <div className={styles.liquiditySourcesWrapper}>
              <div className={styles.horizontalLine} />
              <Text className={styles.liquiditySourcesListText}>
                For a full list of liquidity pairs, visit these sources:
              </Text>
              <div className={styles.liquiditySourcesListWrapper}>
                {getLiquiditySourcesAndAssetsUrls(networkName).map(
                  ({ liquiditySource, url }) => (
                    <Button
                      key={liquiditySource}
                      children={liquiditySource}
                      onClick={() => openUrl(url)}
                      buttonClassName={styles.liquiditySourceButton}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </MainPagePaddedContainer>
      {alert && <GenericAlert {...alert} />}
      {isDefined(errorModal) && <ErrorDetailsModal {...errorModal} />}
    </div>
  );
};
