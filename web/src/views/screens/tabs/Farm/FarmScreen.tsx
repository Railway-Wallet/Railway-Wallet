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
import { Button } from '@components/Button/Button';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { Selector } from '@components/Selector/Selector';
import { Text } from '@components/Text/Text';
import { ERC20ListRow } from '@components/TokenListRow/ERC20ListRow/ERC20ListRow';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  FarmVaultData,
} from '@models/drawer-types';
import {
  CookbookFarmRecipeType,
  ERC20Token,
  ERC20TokenFullInfo,
  filterTokensBySearchField,
  formatNumberToLocaleWithMinDecimals,
  getDecimalBalance,
  getTokenDisplayName,
  getVaultsAndAssetsUrls,
  refreshRailgunBalances,
  styleguide,
  truncateStr,
  useAppDispatch,
  useBalancePriceRefresh,
  useERC20BalancesSerialized,
  useReduxSelector,
  useVaultFetch,
  useWalletTokenVaultsFilter,
} from '@react-shared';
import {
  ErrorDetailsModal,
  ErrorDetailsModalProps,
} from '@screens/modals/ErrorDetailsModal/ErrorDetailsModal';
import { ERC20BasicListHeader } from '@screens/tabs/Wallets/WalletsScreen/ERC20BasicList/ERC20BasicListHeader/ERC20BasicListHeader';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { createExternalSiteAlert } from '@utils/alerts';
import { Spinner } from '@views/components/loading/Spinner/Spinner';
import styles from './FarmScreen.module.scss';

export type FarmScreenState = {
  token?: ERC20TokenFullInfo;
  isRedeem?: boolean;
};

const DEPOSIT_LABEL = 'Farmable assets';
const REDEEM_LABEL = 'Assets to redeem';

type Action = {
  label: string;
  value: string;
};

export const FarmScreen: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const state: Optional<FarmScreenState> = location.state;

  const [tokenSearchText, setTokenSearchText] = useState('');
  const [selectedAction, setSelectedAction] = useState<Action>({
    label: DEPOSIT_LABEL,
    value: CookbookFarmRecipeType.Deposit,
  });
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredTokens, setFilteredTokens] = useState<ERC20Token[]>([]);
  const [errorModal, setErrorModal] = useState<
    ErrorDetailsModalProps | undefined
  >(undefined);

  const { vaults } = useReduxSelector('vaults');
  const { wallets } = useReduxSelector('wallets');
  const { network } = useReduxSelector('network');
  const activeWallet = wallets.active;
  const networkName = network.current.name;

  useEffect(() => {
    if (isDefined(state)) {
      setTokenSearchText(state.token?.symbol ?? '');

      const isRedeem = state.isRedeem ?? false;
      setSelectedAction({
        label: isRedeem ? REDEEM_LABEL : DEPOSIT_LABEL,
        value: isRedeem
          ? CookbookFarmRecipeType.Redeem
          : CookbookFarmRecipeType.Deposit,
      });
    }
  }, [state]);

  const useRailgunBalances = true;
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    useRailgunBalances,
    balanceBucketFilter,
  );

  const { isLoading, refreshVaultData } = useVaultFetch();
  const { availableDepositTokens, availableRedeemTokens } =
    useWalletTokenVaultsFilter(activeWallet, networkName);

  const { pullBalances } = useBalancePriceRefresh(
    refreshRailgunBalances,
    (error: Error) =>
      setErrorModal({
        error,
        onDismiss: () => setErrorModal(undefined),
      }),
  );

  const actions = [
    { label: DEPOSIT_LABEL, value: CookbookFarmRecipeType.Deposit },
    { label: REDEEM_LABEL, value: CookbookFarmRecipeType.Redeem },
  ];
  const networkVaultData = vaults.forNetwork[networkName];

  useEffect(() => {
    if (!isLoading) {
      let availableTokens: ERC20Token[] = [];
      switch (selectedAction.value as CookbookFarmRecipeType) {
        case CookbookFarmRecipeType.Deposit:
          availableTokens = availableDepositTokens;
          break;
        case CookbookFarmRecipeType.Redeem:
          availableTokens = availableRedeemTokens;
          break;
      }

      const filteredTokens = filterTokensBySearchField(
        availableTokens,
        tokenSearchText?.toLowerCase(),
      );
      setFilteredTokens(filteredTokens);
    }
  }, [
    availableDepositTokens,
    availableRedeemTokens,
    isLoading,
    selectedAction.value,
    tokenSearchText,
  ]);

  if (activeWallet?.isViewOnlyWallet ?? false) {
    return <Text>Not available for View-Only wallets</Text>;
  }

  const refreshBalancesAndVaults = async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);

    const skipCache = true;
    await refreshVaultData(network.current.name, skipCache);

    await pullBalances();
    setIsRefreshing(false);
  };

  const onSelectERC20 = (token: ERC20Token) => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.FarmVault,
      extraData: {
        currentToken: token,
        cookbookFarmRecipeType: selectedAction.value,
      } as FarmVaultData,
    });
  };

  const bestAPYForToken = (tokenAddress: string): Optional<number> => {
    switch (selectedAction.value as CookbookFarmRecipeType) {
      case CookbookFarmRecipeType.Deposit:
        return networkVaultData?.depositVaultsForToken[
          tokenAddress.toLowerCase()
        ]?.bestApy;
      case CookbookFarmRecipeType.Redeem:
        return networkVaultData?.redeemVaultForToken[tokenAddress.toLowerCase()]
          ?.apy;
    }
  };

  const getBestAPYPercentage = (tokenAddress: string): string => {
    const bestAPY = bestAPYForToken(tokenAddress);
    if (!isDefined(bestAPY)) {
      return 'N/A';
    }
    return formatNumberToLocaleWithMinDecimals(bestAPY * 100, 2);
  };

  const rightBalances = (token: ERC20Token) => {
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
      <div className={styles.apyContainer}>
        <Text className={styles.apyText}>
          {getBestAPYPercentage(token.address)}% APY
        </Text>
        <Text className={styles.descriptionStyle}>
          {truncateStr(balanceText, 12)}
        </Text>
      </div>
    );
  };

  const renderToken = (token: ERC20Token, index: number) => {
    return (
      <ERC20ListRow
        key={index}
        token={token}
        description={getTokenDisplayName(token, wallets.available, networkName)}
        onSelect={() => onSelectERC20(token)}
        backgroundColor={styleguide.colors.gray6()}
        descriptionClassName={styles.descriptionStyle}
        rightView={() => rightBalances(token)}
      />
    );
  };

  const farmTypeSelector = (
    <Selector
      containerClassName={styles.farmTypeSelector}
      controlClassName={styles.farmTypeSelectorControl}
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

  const farmActionAdjectiveText =
    selectedAction.value === CookbookFarmRecipeType.Deposit
      ? 'farmable'
      : 'redeemable';

  const hasTokens = filteredTokens.length > 0;

  return (
    <div className={cn(styles.pageContainer, 'hide-scroll')}>
      <MainPagePaddedContainer maxWidth={760} minWidth={700}>
        <div className={styles.content}>
          <div className={styles.headerRow}>
            <Text className={styles.headerText}>Farm</Text>
            <Text className={styles.headerSubtext}>
              Earn yield on your shielded balances
            </Text>
          </div>
          <div className={styles.farmContent}>
            <ERC20BasicListHeader
              isRailgun
              showAddTokens={false}
              customRightGroupStartView={farmTypeSelector}
              searchText={tokenSearchText}
              onSearchChange={setTokenSearchText}
              refreshBalances={refreshBalancesAndVaults}
            />
            {isLoading ? (
              <div className={styles.spinnerContainer}>
                <Spinner size={40} />
              </div>
            ) : hasTokens ? (
              <div className={styles.farmList}>
                {filteredTokens.map(renderToken)}
              </div>
            ) : (
              <Text className={styles.placeholderText}>
                No {farmActionAdjectiveText} assets found in your private
                balance.
              </Text>
            )}
            <div className={styles.farmSourcesWrapper}>
              <div className={styles.horizontalLine} />
              <Text className={styles.farmSourcesListText}>
                For a full list of {farmActionAdjectiveText} tokens, visit these
                sources:
              </Text>
              <div className={styles.farmSourcesListWrapper}>
                {getVaultsAndAssetsUrls().map(
                  ({ vaultDisplayName, assetsUrl }) => (
                    <Button
                      key={vaultDisplayName}
                      children={vaultDisplayName}
                      onClick={() => openUrl(assetsUrl)}
                      buttonClassName={styles.farmSourceButton}
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
