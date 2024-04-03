import {
  isDefined,
  RailgunWalletBalanceBucket,
  WalletCreationType,
} from '@railgun-community/shared-models';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionSheetOption,
  StyledActionSheet,
} from '@components/ActionSheet/StyledActionSheet';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Text } from '@components/Text/Text';
import { TransactionList } from '@components/TransactionList/TransactionList';
import { useWalletCreationModals } from '@hooks/useWalletCreationModals';
import {
  AddTokensData,
  DrawerName,
  EVENT_CLOSE_DRAWER,
  EVENT_OPEN_DRAWER_WITH_DATA,
} from '@models/drawer-types';
import { ActionSheetRef } from '@railway-developer/actionsheet-react';
import {
  AppSettingsService,
  CalloutType,
  compareTokens,
  ERC20Token,
  getTokenDisplayNameShort,
  showImmediateToast,
  styleguide,
  ToastType,
  useAddedTokenSearch,
  useAppDispatch,
  useFilteredTokenTransactions,
  usePOIRequiredForCurrentNetwork,
  useReduxSelector,
  WalletTokenService,
} from '@react-shared';
import { TabRoute } from '@root/App/TabNavigator/TabContainer/TabContainer';
import { SwapScreenState } from '@screens/tabs/Swap/SwapScreen';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { hasPassword } from '@services/security/password-service';
import { IconType, renderIcon } from '@services/util/icon-service';
import { copyToClipboard } from '@utils/clipboard';
import { FarmScreenState } from '@views/screens/tabs/Farm/FarmScreen';
import { ERC20Card } from './ERC20Card/ERC20Card';
import styles from './ERC20Info.module.scss';

type Props = {
  token: ERC20Token;
  isRailgun: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const ERC20Info: React.FC<Props> = ({
  token,
  isRailgun,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkPrices } = useReduxSelector('networkPrices');

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const actionSheetRef = useRef<ActionSheetRef>();
  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);
  const [showAddTokenButton, setShowAddTokenButton] = useState(false);

  const showBackChevron = false;
  const {
    showCreatePassword,
    showImportWallet,
    showCreateWallet,
    createPasswordModal,
    createWalletModal,
    importWalletModal,
    seedPhraseCalloutModal,
    viewingKeyCalloutModal,
    newWalletSuccessModal,
  } = useWalletCreationModals(showBackChevron);
  const { tokenTransactions } = useFilteredTokenTransactions(token, isRailgun);
  const { tokens } = useAddedTokenSearch();
  const { poiRequired } = usePOIRequiredForCurrentNetwork();
  useEffect(() => {
    let isTokenAddedToWallet = false;
    for (const addedToken of tokens) {
      const match = compareTokens(addedToken, token);
      if (match) {
        isTokenAddedToWallet = true;
        break;
      }
    }

    setShowAddTokenButton(!isTokenAddedToWallet);
  }, [tokens, token]);

  if (!isDefined(token)) {
    return null;
  }

  const pricesForNetwork =
    networkPrices.forNetwork[network.current.name]?.forCurrency[
      AppSettingsService.currency.code
    ];
  const tokenPrice = isDefined(pricesForNetwork)
    ? pricesForNetwork[token.address.toLowerCase()]
    : undefined;
  const showPriceUnknown =
    !(network.current.isTestnet ?? false) && !isDefined(tokenPrice);

  const onActionCreateWallet = async () => {
    if (!(await hasPassword())) {
      return showCreatePassword(WalletCreationType.Create);
    }
    return showCreateWallet();
  };

  const onActionImportWallet = async () => {
    if (!(await hasPassword())) {
      return showCreatePassword(WalletCreationType.Import);
    }
    return showImportWallet();
  };

  const onActionUnshieldERC20s = () => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.UnshieldERC20s,
      extraData: {
        erc20: token,
      },
    });
  };

  const onActionShieldERC20s = () => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.ShieldERC20s,
      extraData: {
        erc20: token,
      },
    });
  };

  const onActionSendERC20s = () => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.SendERC20s,
      extraData: {
        erc20: token,
      },
    });
  };

  const onActionReceiveTokens = () => {
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.ReceiveTokens,
    });
  };

  const onActionSwapERC20s = () => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
    const state: SwapScreenState = { token };
    navigate(TabRoute.Swap, { state });
  };

  const onActionFarmERC20s = (isRedeem: boolean) => {
    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
    if (token.isAddressOnly !== true) {
      const state: FarmScreenState = { token, isRedeem };
      navigate(TabRoute.Farm, { state });
    }
  };

  const removeToken = () => {
    if (!wallets.active) {
      setAlert({
        title: 'Add wallet',
        message: 'Please create or import a wallet to customize your tokens.',
        onClose: () => setAlert(undefined),
      });
      return;
    }
    if (
      !(token.isAddressOnly ?? false) &&
      (token.disableWalletRemoval ?? false)
    ) {
      setAlert({
        title: 'Cannot remove token',
        message: `${token.symbol} is required for this wallet.`,
        onClose: () => setAlert(undefined),
      });
      return;
    }

    setAlert({
      title: 'Remove this token?',
      message:
        'Any balance will be stored. You may add this token back at any time.',
      onClose: () => setAlert(undefined),
      submitTitle: 'Remove token',
      onSubmit: async () => {
        setAlert(undefined);
        await finishRemoveToken();
      },
    });
  };
  const finishRemoveToken = async () => {
    if (!wallets.active) {
      return;
    }

    const walletTokenService = new WalletTokenService(dispatch);
    await walletTokenService.removeTokenFromWallet(
      wallets.active,
      token,
      network.current,
    );

    drawerEventsBus.dispatch(EVENT_CLOSE_DRAWER);
  };

  const copyTokenAddress = async () => {
    await copyToClipboard(token.address);
    dispatch(
      showImmediateToast({
        message: `${getTokenDisplayNameShort(
          token,
          wallets.available,
          network.current.name,
        )} contract address copied to clipboard.`,
        type: ToastType.Copy,
      }),
    );
  };

  const addTokenToWallet = () => {
    const extraData: AddTokensData = {
      customTokenAddress: token.address,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.AddTokens,
      extraData,
    });
  };

  const actionSheetOptions: ActionSheetOption[] = [
    {
      name: 'Remove token',
      action: removeToken,
    },
  ];

  if (!(token.isBaseToken ?? false)) {
    actionSheetOptions.unshift({
      name: `Copy ${getTokenDisplayNameShort(
        token,
        wallets.available,
        network.current.name,
      )} contract address`,
      action: copyTokenAddress,
    });
  }

  if (showAddTokenButton) {
    actionSheetOptions.unshift({
      name: 'Add token to wallet',
      action: addTokenToWallet,
    });
  }
  const onTapOptions = () => {
    actionSheetRef.current?.open();
  };

  const onSelectOption = (option: ActionSheetOption) => {
    actionSheetRef.current?.close();
    option.action();
  };

  const priceUnknownCallout = () => {
    return (
      <InfoCallout
        type={CalloutType.Help}
        text="Could not find price for this token."
        borderColor={styleguide.colors.danger}
        gradientColors={styleguide.colors.gradients.redCallout.colors}
        className={styles.topInfoCallout}
      />
    );
  };

  return (
    <>
      <StyledActionSheet
        title="Token options"
        actionSheetRef={actionSheetRef}
        actionSheetOptions={actionSheetOptions}
        onSelectOption={onSelectOption}
      />
      <div className={styles.erc20InfoContainer}>
        {showPriceUnknown && priceUnknownCallout()}
        <div className={styles.topButtonContainer}>
          <div className={styles.optionsButton} onClick={onTapOptions}>
            {renderIcon(IconType.Ellipsis, 24)}
          </div>
        </div>
        <ERC20Card
          token={token}
          tokenPrice={tokenPrice}
          isRailgun={isRailgun}
          balanceBucketFilter={balanceBucketFilter}
          onActionCreateWallet={onActionCreateWallet}
          onActionImportWallet={onActionImportWallet}
          onActionUnshieldERC20s={onActionUnshieldERC20s}
          onActionShieldERC20s={onActionShieldERC20s}
          onActionSendERC20s={onActionSendERC20s}
          onActionReceiveTokens={onActionReceiveTokens}
          onActionSwapERC20s={onActionSwapERC20s}
          onActionFarmERC20s={onActionFarmERC20s}
        />
        <div className={styles.transactionsWrapper}>
          <Text className={styles.transactionsHeaderText}>Transactions</Text>
          <TransactionList
            transactionsMissingTimestamp={[]}
            transactions={tokenTransactions}
            resyncTransactions={async () => {}}
            filteredToken={token}
            isRailgunForTokenInfo={isRailgun}
            poiRequired={poiRequired}
          />
        </div>
        {createPasswordModal}
        {createWalletModal}
        {importWalletModal}
        {seedPhraseCalloutModal}
        {viewingKeyCalloutModal}
        {newWalletSuccessModal}
      </div>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
