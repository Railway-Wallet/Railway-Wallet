import { isDefined } from '@railgun-community/shared-models';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { Button } from '@components/Button/Button';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Spinner } from '@components/loading/Spinner/Spinner';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { Text } from '@components/Text/Text';
import {
  DrawerName,
  EphemeralReclaimData,
  EVENT_OPEN_DRAWER_WITH_DATA,
} from '@models/drawer-types';
import {
  AppSettingsService,
  AuthenticatedWalletService,
  calculateBalanceCurrency,
  CalloutType,
  EphemeralAccountAssociation,
  EphemeralAccountBalance,
  EphemeralAccountRef,
  ephemeralAccountTransactionText,
  EphemeralTradedToken,
  ERC20Token,
  ERC20TokenBalance,
  formatTransactionTimestamp,
  is7702Network,
  SavedTransaction,
  shortenWalletAddress,
  showImmediateToast,
  styleguide,
  ToastType,
  tokenAddressForPrices,
  transactionStatusIconColor,
  transactionTitle,
  UnauthenticatedWalletService,
  useAddedTokenSearch,
  useAppDispatch,
  useEphemeralAccountAssociations,
  useEphemeralAccountBalances,
  useEphemeralAccounts,
  useReduxSelector,
} from '@react-shared';
import { EnterPasswordModal } from '@screens/modals/EnterPasswordModal/EnterPasswordModal';
import { ERC20BasicListRow } from '@screens/tabs/Wallets/WalletsScreen/ERC20BasicList/ERC20BasicListRow/ERC20BasicListRow';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType, renderIcon } from '@services/util/icon-service';
import { copyToClipboard } from '@utils/clipboard';
import styles from './EphemeralAccounts.module.scss';

export const EphemeralAccountsScreen = () => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { networkPrices } = useReduxSelector('networkPrices');
  const dispatch = useAppDispatch();

  const networkName = network.current.name;
  const railWalletID = wallets.active?.railWalletID;
  const supports7702 = is7702Network(networkName);

  const [authKey, setAuthKey] = useState<Optional<string>>(undefined);
  const [showEnterPassword, setShowEnterPassword] = useState(false);
  const [alert, setAlert] = useState<Optional<AlertProps>>(undefined);
  const [busy, setBusy] = useState(false);
  const [expandedAddresses, setExpandedAddresses] = useState<
    Record<string, boolean>
  >({});

  const toggleExpanded = (address: string, isCurrent: boolean) =>
    setExpandedAddresses(prev => ({
      ...prev,
      [address]: !(prev[address] ?? isCurrent),
    }));

  const { current, past, loading, error, refresh } =
    useEphemeralAccounts(authKey);

  const accounts = useMemo(
    () => [
      ...(isDefined(current) ? [{ account: current, isCurrent: true }] : []),
      ...past.map(account => ({ account, isCurrent: false })),
    ],
    [current, past],
  );

  const accountAddresses = accounts.map(({ account }) => account.address);

  const { associations } = useEphemeralAccountAssociations(accountAddresses);
  const { balances, loadingAddresses, scanAccount } =
    useEphemeralAccountBalances();

  const accountHoldsFunds = (address: string): boolean => {
    const balance = balances[address];
    return (
      isDefined(balance) &&
      ((balance.native ?? 0n) > 0n || balance.erc20.length > 0)
    );
  };
  const fundedPast = past.filter(account => accountHoldsFunds(account.address));
  const otherPast = past.filter(account => !accountHoldsFunds(account.address));

  const { tokens: addedTokens } = useAddedTokenSearch();
  const scanTokens: EphemeralTradedToken[] = useMemo(
    () =>
      addedTokens
        .filter(token => !(token.isBaseToken ?? false))
        .map(token => ({
          address: token.address,
          symbol:
            'symbol' in token && isDefined(token.symbol)
              ? token.symbol
              : token.address,
          decimals: token.decimals,
          isBaseToken: false,
        })),
    [addedTokens],
  );
  const scanTokensForAccount = useCallback(
    (
      association: Optional<EphemeralAccountAssociation>,
    ): EphemeralTradedToken[] => {
      const tokens = [...scanTokens];
      for (const token of association?.tokens ?? []) {
        const known = tokens.some(
          scanToken => scanToken.address.toLowerCase() === token.address,
        );
        if (!token.isBaseToken && !known) {
          tokens.push(token);
        }
      }
      return tokens;
    },
    [scanTokens],
  );

  const autoScannedAddresses = useRef(new Set<string>());
  const scanContext = useRef('');
  useEffect(() => {
    const context = `${networkName}:${railWalletID ?? ''}`;
    if (scanContext.current !== context) {
      autoScannedAddresses.current.clear();
      scanContext.current = context;
      return;
    }
    if (
      loading ||
      !isDefined(authKey) ||
      !isDefined(railWalletID) ||
      !supports7702
    ) {
      return;
    }

    for (const { account } of accounts) {
      const address = account.address.toLowerCase();
      const association = associations[address];
      if (
        !isDefined(association) ||
        association.transactions.length === 0 ||
        isDefined(balances[account.address]) ||
        loadingAddresses.includes(account.address) ||
        autoScannedAddresses.current.has(address)
      ) {
        continue;
      }
      autoScannedAddresses.current.add(address);
      scanAccount({
        address: account.address,
        tokens: scanTokensForAccount(association),
      });
    }
  }, [
    accounts,
    associations,
    authKey,
    balances,
    loading,
    loadingAddresses,
    networkName,
    railWalletID,
    scanAccount,
    scanTokensForAccount,
    supports7702,
  ]);

  const tokenPrices =
    networkPrices.forNetwork[networkName]?.forCurrency[
      AppSettingsService.currency.code
    ];

  const addedTokensByAddress = useMemo(
    () =>
      new Map(addedTokens.map(token => [token.address.toLowerCase(), token])),
    [addedTokens],
  );
  const baseERC20Token = addedTokens.find(token => token.isBaseToken ?? false);

  const toTokenBalance = (
    token: ERC20Token,
    balance: bigint,
  ): ERC20TokenBalance => ({
    token,
    balance,
    balanceCurrency: calculateBalanceCurrency(token, balance, tokenPrices),
    priceCurrency: tokenPrices?.[tokenAddressForPrices(token)],
  });

  const copyAddress = async (address: string) => {
    await copyToClipboard(address);
    dispatch(
      showImmediateToast({
        message: 'Ephemeral account address copied.',
        type: ToastType.Copy,
      }),
    );
  };

  const activityDescription = (
    tx: SavedTransaction,
    accountAddress: string,
  ): string =>
    ephemeralAccountTransactionText(
      tx,
      accountAddress,
      network.current,
      wallets.active,
      wallets.available,
    ) ?? '';

  const renderActivityLine = (tx: SavedTransaction, accountAddress: string) => (
    <div key={tx.id} className={styles.activityLine}>
      <div className={styles.activityTop}>
        <Text
          className={styles.activityStatus}
          color={transactionStatusIconColor(tx)}
        >
          {transactionTitle(tx) ?? ''}
        </Text>
        <Text className={styles.activityTime}>
          {formatTransactionTimestamp(tx.timestamp)}
        </Text>
      </div>
      <Text className={styles.activityDesc}>
        {activityDescription(tx, accountAddress)}
      </Text>
    </div>
  );

  const handleReclaim = (
    balance: EphemeralAccountBalance,
    ephemeralAddress: string,
    ephemeralIndex: Optional<number>,
  ) => {
    const erc20Tokens = balance.erc20.map(
      ({ token, balance: tokenBalance }) => ({
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        amountString: tokenBalance.toString(),
      }),
    );
    const nativeWeiString =
      isDefined(balance.native) && balance.native > 0n
        ? balance.native.toString()
        : undefined;
    const extraData: EphemeralReclaimData = {
      ephemeralAddress,
      erc20Tokens,
      nativeWeiString,
      ephemeralIndex,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.EphemeralReclaim,
      extraData,
    });
  };

  const copyPrivateKey = async (index: number) => {
    if (!isDefined(authKey) || !isDefined(railWalletID)) {
      return;
    }

    try {
      const privateKey = await new AuthenticatedWalletService(
        authKey,
      ).getEphemeralPrivateKey(railWalletID, network.current.chain.id, index);
      await copyToClipboard(privateKey);
      dispatch(
        showImmediateToast({
          message:
            'Ephemeral private key copied. Be careful - it can be used to access this account.',
          type: ToastType.Copy,
        }),
      );
    } catch (err) {
      dispatch(
        showImmediateToast({
          message: `Copy private key failed: ${String(err)}`,
          type: ToastType.Error,
        }),
      );
    }
  };

  const handleCopyPrivateKey = (index: number) => {
    setAlert({
      title: 'Copy private key?',
      message: `Anyone with this key controls ephemeral account #${index}. Import it only into a wallet you trust.`,
      submitTitle: 'Copy',
      onSubmit: async () => {
        setAlert(undefined);
        await copyPrivateKey(index);
      },
      onClose: () => setAlert(undefined),
    });
  };

  const doRotate = async () => {
    if (!isDefined(railWalletID)) {
      return;
    }
    setBusy(true);
    try {
      await new UnauthenticatedWalletService().ratchetEphemeralAddress(
        networkName,
        railWalletID,
      );
      refresh();
      dispatch(
        showImmediateToast({
          message: 'Rotated to a fresh ephemeral account.',
          type: ToastType.Success,
        }),
      );
    } catch (err) {
      dispatch(
        showImmediateToast({
          message: `Rotate failed: ${String(err)}`,
          type: ToastType.Error,
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRotate = () => {
    const currentBalance = isDefined(current)
      ? balances[current.address]
      : undefined;
    const currentHoldsFunds =
      isDefined(currentBalance) &&
      ((currentBalance.native ?? 0n) > 0n || currentBalance.erc20.length > 0);
    if (currentHoldsFunds) {
      setAlert({
        title: 'Current account holds funds',
        message:
          'Rotating leaves the funds on the current ephemeral account. Reclaim them into your RAILGUN wallet first, or reclaim them from the rotated account later.',
        onClose: () => setAlert(undefined),
      });
      return;
    }
    setAlert({
      title: 'Rotate ephemeral account?',
      message:
        'A fresh, never-used executor account will be derived for your next private transaction. Scan an account without recorded activity before rotating so you do not abandon stranded funds.',
      submitTitle: 'Rotate',
      onSubmit: () => {
        setAlert(undefined);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        doRotate();
      },
      onClose: () => setAlert(undefined),
    });
  };

  const handleRecover = async () => {
    if (!isDefined(authKey) || !isDefined(railWalletID)) {
      return;
    }
    setBusy(true);
    try {
      const index = await new AuthenticatedWalletService(
        authKey,
      ).syncEphemeralIndex(network.current.chain, railWalletID);
      refresh();
      dispatch(
        showImmediateToast({
          message: `Recalculated ephemeral index from chain history (index ${index}).`,
          type: ToastType.Success,
        }),
      );
    } catch (err) {
      dispatch(
        showImmediateToast({
          message: `Recalculate failed: ${String(err)}`,
          type: ToastType.Error,
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const renderCallout = (type: CalloutType, text: string) =>
    type === CalloutType.Warning ? (
      <InfoCallout
        type={type}
        text={text}
        className={styles.infoCallout}
        borderColor={styleguide.colors.danger}
        gradientColors={styleguide.colors.gradients.redCallout.colors}
      />
    ) : (
      <InfoCallout type={type} text={text} className={styles.infoCallout} />
    );

  const renderAccountRow = (
    account: EphemeralAccountRef,
    isCurrent: boolean,
  ) => {
    const balance = balances[account.address];
    const scanned = isDefined(balance);
    const isLoading = loadingAddresses.includes(account.address);
    const nativeBalance = balance?.native;
    const erc20Balances = balance?.erc20 ?? [];
    const nativeStranded = isDefined(nativeBalance) && nativeBalance > 0n;
    const holdsFunds = scanned && (nativeStranded || erc20Balances.length > 0);

    const heldBalances: ERC20TokenBalance[] = [];
    if (isDefined(nativeBalance) && isDefined(baseERC20Token)) {
      heldBalances.push(toTokenBalance(baseERC20Token, nativeBalance));
    }
    for (const { token, balance: tokenBalance } of erc20Balances) {
      const addedToken = addedTokensByAddress.get(token.address.toLowerCase());
      heldBalances.push(
        toTokenBalance(
          addedToken ?? {
            isAddressOnly: true,
            address: token.address,
            decimals: token.decimals,
            isBaseToken: false,
          },
          tokenBalance,
        ),
      );
    }

    const association = associations[account.address.toLowerCase()];
    const tradedTokens = association?.tokens ?? [];
    const accountTransactions = association?.transactions ?? [];
    const expanded = expandedAddresses[account.address] ?? isCurrent;
    const latestTx = accountTransactions[0];
    const accountIndex = account.index;

    return (
      <div
        key={account.address}
        className={cn(styles.slot, { [styles.slotCurrent]: isCurrent })}
      >
        <button
          type="button"
          className={styles.slotHeader}
          onClick={() => toggleExpanded(account.address, isCurrent)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} account ${account.index ?? ''} ${account.address}`}
        >
          <span
            className={cn(styles.chevron, { [styles.chevronOpen]: expanded })}
          >
            {renderIcon(
              IconType.ChevronRight,
              16,
              styleguide.colors.labelSecondary,
            )}
          </span>
          <span className={styles.slotMain}>
            <span className={styles.slotTopLine}>
              <span className={styles.slotIdentity}>
                {isDefined(account.index) && (
                  <span className={styles.slotIndex}>#{account.index}</span>
                )}
                <span className={styles.slotAddress}>
                  {shortenWalletAddress(account.address)}
                </span>
              </span>
              <span className={styles.slotBadges}>
                {holdsFunds && (
                  <span className={styles.strandedPill}>Holds funds</span>
                )}
                {isCurrent && (
                  <span className={styles.slotTagCurrent}>Current</span>
                )}
              </span>
            </span>
            {accountTransactions.length > 0 && isDefined(latestTx) ? (
              <span className={styles.slotSubline}>
                {`${activityDescription(latestTx, account.address)}${
                  accountTransactions.length > 1
                    ? ` · +${accountTransactions.length - 1} more`
                    : ''
                }`}
              </span>
            ) : isCurrent || scanned ? (
              <span className={styles.slotSubline}>
                {scanned ? 'No funds detected' : 'Not checked for funds'}
              </span>
            ) : null}
          </span>
        </button>
        {expanded && (
          <div className={styles.slotBody}>
            <button
              type="button"
              className={styles.addressRow}
              onClick={() => copyAddress(account.address)}
              aria-label={`Copy address ${account.address}`}
            >
              <span className={styles.addressText}>{account.address}</span>
              <span className={styles.copyIcon} aria-hidden="true">
                {renderIcon(
                  IconType.Copy,
                  16,
                  styleguide.colors.labelSecondary,
                )}
              </span>
            </button>
            {tradedTokens.length > 0 && (
              <div className={styles.tradedRow}>
                <Text className={styles.balanceLabel}>Assets traded</Text>
                <div className={styles.tokenChips}>
                  {tradedTokens.map(token => (
                    <Text key={token.address} className={styles.tokenChip}>
                      {token.symbol}
                    </Text>
                  ))}
                </div>
              </div>
            )}
            {accountTransactions.length > 0 && (
              <div className={styles.txList}>
                <Text className={styles.balanceLabel}>Activity</Text>
                <div className={styles.txListItems}>
                  {accountTransactions.map(tx =>
                    renderActivityLine(tx, account.address),
                  )}
                </div>
              </div>
            )}
            {scanned && (
              <div className={styles.balanceList}>
                <Text className={styles.balanceLabel}>Balance</Text>
                {heldBalances.length > 0 ? (
                  heldBalances.map(tokenBalance => (
                    <ERC20BasicListRow
                      key={tokenBalance.token.address}
                      tokenBalance={tokenBalance}
                      hasPendingBalance={false}
                    />
                  ))
                ) : (
                  <Text className={styles.balanceValue}>—</Text>
                )}
              </div>
            )}
            <div className={styles.cardActions}>
              <Button
                startIcon={IconType.Refresh}
                buttonClassName={styles.cardScanButton}
                loading={isLoading}
                disabled={isLoading}
                onClick={() =>
                  scanAccount({
                    address: account.address,
                    tokens: scanTokensForAccount(association),
                  })
                }
              >
                {scanned ? 'Rescan' : 'Scan for funds'}
              </Button>
              {}
              {holdsFunds && (isCurrent || isDefined(account.index)) && (
                <Button
                  startIcon={IconType.Shield}
                  buttonClassName={styles.cardReclaimButton}
                  onClick={() =>
                    handleReclaim(balance, account.address, account.index)
                  }
                >
                  Reclaim to RAILGUN
                </Button>
              )}
              {isDefined(accountIndex) && (
                <Button
                  startIcon={IconType.LockClosed}
                  buttonClassName={styles.cardKeyButton}
                  onClick={() => handleCopyPrivateKey(accountIndex)}
                >
                  Copy private key
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUnlocked = () => (
    <>
      {isDefined(error) &&
        renderCallout(
          CalloutType.Warning,
          `Could not load ephemeral accounts: ${error}`,
        )}
      <section>
        <h2 className={styles.sectionHeader}>Account tools</h2>
        <div className={styles.actionsRow}>
          <Button
            startIcon={IconType.Refresh}
            buttonClassName={styles.actionButton}
            disabled={busy}
            onClick={handleRotate}
          >
            Rotate to a fresh account
          </Button>
          <Button
            startIcon={IconType.Refresh}
            buttonClassName={styles.actionButton}
            disabled={busy}
            onClick={handleRecover}
          >
            Recalculate index
          </Button>
        </div>
        <Text className={styles.actionsNote}>
          Check for funds before you rotate. Recalculate the index after you
          restore a wallet.
        </Text>
      </section>
      <Text className={styles.privacyNote}>
        Balance checks send the account address to your configured RPC
        providers, including enabled backups. Accounts with activity are checked
        automatically. Other accounts are checked only when you select Scan for
        funds.
      </Text>
      {loading && accounts.length === 0 ? (
        <div className={styles.loadingRow}>
          <Spinner size={20} />
          <Text className={styles.loadingText}>Loading…</Text>
        </div>
      ) : accounts.length > 0 ? (
        <>
          {isDefined(current) && (
            <section>
              <h2 className={styles.sectionHeader}>Current account</h2>
              {renderAccountRow(current, true)}
            </section>
          )}
          {fundedPast.length > 0 && (
            <section>
              <h2 className={styles.sectionHeader}>Accounts with funds</h2>
              <div className={styles.accountList}>
                {fundedPast.map(account => renderAccountRow(account, false))}
              </div>
            </section>
          )}
          {otherPast.length > 0 && (
            <section>
              <h2 className={styles.sectionHeader}>
                Previous accounts ({otherPast.length})
              </h2>
              <div className={styles.accountList}>
                {otherPast.map(account => renderAccountRow(account, false))}
              </div>
            </section>
          )}
        </>
      ) : (
        <Text className={styles.emptyText}>
          No ephemeral accounts for this network yet.
        </Text>
      )}
    </>
  );

  const renderContent = () => {
    if (!supports7702) {
      return renderCallout(
        CalloutType.Info,
        `Ephemeral accounts are only used on EIP-7702 networks (Ethereum, Arbitrum, Polygon, BNB Chain, Sepolia). ${network.current.publicName} does not use them.`,
      );
    }
    return (
      <>
        <Text className={styles.introNote}>
          These accounts execute EIP-7702 transactions. Do not send funds to
          them directly.
        </Text>
        {isDefined(authKey) ? (
          renderUnlocked()
        ) : (
          <div className={styles.lockedCard}>
            <Text className={styles.lockedText}>
              Enter your wallet password to view and manage your ephemeral
              accounts.
            </Text>
            <Button
              startIcon={IconType.LockOpen}
              buttonClassName={styles.unlockButton}
              onClick={() => setShowEnterPassword(true)}
            >
              Unlock
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <MainPagePaddedContainer maxWidth={760} minWidth={520}>
        <div className={styles.headerRow}>
          <h1 className={styles.headerText}>Ephemeral Accounts</h1>
          <Text className={styles.headerSubtext}>
            Temporary executor accounts for EIP-7702 transactions
          </Text>
        </div>
        {renderContent()}
      </MainPagePaddedContainer>
      {showEnterPassword && (
        <EnterPasswordModal
          success={key => {
            setAuthKey(key);
            setShowEnterPassword(false);
          }}
          onDismiss={() => setShowEnterPassword(false)}
          descriptionText="Your password is required to view your ephemeral accounts."
        />
      )}
      {alert && <GenericAlert {...alert} />}
    </div>
  );
};
