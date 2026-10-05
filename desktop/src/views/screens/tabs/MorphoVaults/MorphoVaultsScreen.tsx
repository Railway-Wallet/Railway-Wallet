import {
  isDefined,
  NetworkName,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { formatUnits, isAddress, parseUnits } from 'ethers';
import { Button } from '@components/Button/Button';
import { Checkbox } from '@components/Checkbox/Checkbox';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Input } from '@components/Input/Input';
import { MainPagePaddedContainer } from '@components/MainPagePaddedContainer/MainPagePaddedContainer';
import { Selector } from '@components/Selector/Selector';
import { Text } from '@components/Text/Text';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  MorphoVaultDepositData,
  MorphoVaultRedeemData,
} from '@models/drawer-types';
import {
  CalloutType,
  ERC20Amount,
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  getDecimalBalance,
  getERC20Decimals,
  getKnownMorphoVaults,
  SelectTokenPurpose,
  SharedConstants,
  styleguide,
  TransactionType,
  useERC20Balance,
  useERC20BalancesSerialized,
  useMorphoVaultData,
  useMorphoVaultList,
  useReduxSelector,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { IconType, renderIcon } from '@services/util/icon-service';
import { ERC20AmountsEntry } from '@views/components/amounts-entry/ERC20AmountsEntry';
import { SelectERC20Modal } from '@views/screens/modals/SelectTokenModal/SelectERC20Modal';
import { SlippageSelectorModal } from '@views/screens/modals/SlippageSelectorModal/SlippageSelectorModal';
import styles from './MorphoVaults.module.scss';

const BALANCE_BUCKET_FILTER = [RailgunWalletBalanceBucket.Spendable];
const KNOWN_VAULTS = getKnownMorphoVaults();

const MIN_TVL_USD = 100_000;

const MAX_PLAUSIBLE_APY = 1;

const DEPOSIT_ACTION = 'deposit';
const REDEEM_ACTION = 'redeem';

type VaultAction = {
  label: string;
  value: string;
};

type MorphoVaultDescriptor = {
  name: string;
  assetSymbol?: string;
};

type HeldVaultPosition = MorphoVaultDescriptor & {
  vaultAddress: string;
  balance: bigint;
};

const VAULT_ACTIONS: VaultAction[] = [
  { label: 'Deposit', value: DEPOSIT_ACTION },
  { label: 'Redeem', value: REDEEM_ACTION },
];

const formatUsdCompact = (usd: number): string => {
  if (usd >= 1e9) {
    return `${(usd / 1e9).toFixed(1)}B`;
  }
  if (usd >= 1e6) {
    return `${(usd / 1e6).toFixed(1)}M`;
  }
  if (usd >= 1e3) {
    return `${(usd / 1e3).toFixed(1)}K`;
  }
  return usd.toFixed(0);
};

export const MorphoVaultsScreen = () => {
  const { network } = useReduxSelector('network');
  const networkName = network.current.name;
  const isSupported = networkName === NetworkName.Ethereum;

  const [selectedAction, setSelectedAction] = useState<VaultAction>(
    VAULT_ACTIONS[0],
  );
  const isDeposit = selectedAction.value === DEPOSIT_ACTION;

  const [vaultAddress, setVaultAddress] = useState('');
  const [vaultSearch, setVaultSearch] = useState('');
  const [showLowQuality, setShowLowQuality] = useState(false);
  const [sellTokenAmount, setSellTokenAmount] =
    useState<Optional<ERC20Amount>>();
  const [showAmountEntry, setShowAmountEntry] = useState(true);
  const [slippagePercentage, setSlippagePercentage] = useState(
    SharedConstants.DEFAULT_SLIPPAGE_PRIVATE_TXS,
  );
  const [showSlippageModal, setShowSlippageModal] = useState(false);

  const [redeemSharesString, setRedeemSharesString] = useState('');
  const [redeemBuyPending, setRedeemBuyPending] = useState(false);

  const { wallets } = useReduxSelector('wallets');

  const { vaultInfo, isLoading, error } = useMorphoVaultData(
    vaultAddress.trim() === '' ? undefined : vaultAddress.trim(),
  );

  const { tokenBalancesSerialized } = useERC20BalancesSerialized(
    true,
    BALANCE_BUCKET_FILTER,
  );

  const {
    vaults: apiVaults,
    isLoading: browseLoading,
    error: browseError,
  } = useMorphoVaultList(true);
  const qualityVaults = showLowQuality
    ? apiVaults
    : apiVaults.filter(
        v =>
          v.tvlUsd >= MIN_TVL_USD &&
          v.netApy > 0 &&
          v.netApy <= MAX_PLAUSIBLE_APY,
      );
  const search = vaultSearch.trim().toLowerCase();
  const filteredVaults =
    search === ''
      ? qualityVaults
      : qualityVaults.filter(
          v =>
            v.name.toLowerCase().includes(search) ||
            v.assetSymbol.toLowerCase().includes(search) ||
            v.vaultAddress.toLowerCase().includes(search),
        );
  const hiddenVaultCount = apiVaults.length - qualityVaults.length;

  const vaultsByAddress = useMemo(() => {
    const byAddress = new Map<string, MorphoVaultDescriptor>();
    for (const vault of KNOWN_VAULTS) {
      byAddress.set(vault.vaultAddress.toLowerCase(), { name: vault.name });
    }
    for (const vault of apiVaults) {
      byAddress.set(vault.vaultAddress.toLowerCase(), {
        name: vault.name,
        assetSymbol: vault.assetSymbol,
      });
    }
    return byAddress;
  }, [apiVaults]);

  const heldVaultPositions: HeldVaultPosition[] = useMemo(() => {
    const positions: HeldVaultPosition[] = [];
    for (const [tokenAddress, balance] of Object.entries(
      tokenBalancesSerialized,
    )) {
      const vault = vaultsByAddress.get(tokenAddress.toLowerCase());
      if (!isDefined(vault) || !isDefined(balance) || BigInt(balance) <= 0n) {
        continue;
      }
      positions.push({
        ...vault,
        vaultAddress: tokenAddress.toLowerCase(),
        balance: BigInt(balance),
      });
    }
    return positions;
  }, [tokenBalancesSerialized, vaultsByAddress]);

  const sharesToken: Optional<ERC20Token> = isDefined(vaultInfo)
    ? {
        address: vaultInfo.vaultAddress,
        name: 'Morpho Vault Shares',
        symbol: 'shares',
        decimals: vaultInfo.shareDecimals,
        isBaseToken: false,
      }
    : undefined;
  const { tokenBalance: sharesBalance } = useERC20Balance(
    wallets.active,
    sharesToken,
    true,
    BALANCE_BUCKET_FILTER,
  );

  const redeemSharesBaseUnits = (() => {
    if (!isDefined(vaultInfo) || redeemSharesString.trim() === '') {
      return 0n;
    }
    try {
      return parseUnits(redeemSharesString.trim(), vaultInfo.shareDecimals);
    } catch {
      return 0n;
    }
  })();
  const holdsSelectedVaultShares =
    isDefined(sharesBalance) && sharesBalance > 0n;
  const validRedeemShares =
    redeemSharesBaseUnits > 0n &&
    holdsSelectedVaultShares &&
    redeemSharesBaseUnits <= sharesBalance;
  const sharesBalanceDisplay =
    isDefined(sharesBalance) && isDefined(vaultInfo)
      ? formatUnits(sharesBalance, vaultInfo.shareDecimals)
      : undefined;

  const [shareDecimals, setShareDecimals] = useState<Record<string, number>>(
    {},
  );
  const filteredPositions =
    search === ''
      ? heldVaultPositions
      : heldVaultPositions.filter(
          position =>
            position.name.toLowerCase().includes(search) ||
            (position.assetSymbol?.toLowerCase().includes(search) ?? false) ||
            position.vaultAddress.includes(search),
        );

  const heldVaultAddresses = heldVaultPositions
    .map(position => position.vaultAddress)
    .join(',');

  useEffect(() => {
    const addresses =
      heldVaultAddresses === '' ? [] : heldVaultAddresses.split(',');
    if (addresses.length === 0) {
      return;
    }
    let cancelled = false;
    const readDecimals = async () => {
      const entries = await Promise.all(
        addresses.map(async address => {
          try {
            return [
              address,
              Number(await getERC20Decimals(networkName, address)),
            ] as const;
          } catch {
            return undefined;
          }
        }),
      );
      if (cancelled) {
        return;
      }
      setShareDecimals(previous => {
        const next = { ...previous };
        for (const entry of entries) {
          if (isDefined(entry)) {
            next[entry[0]] = entry[1];
          }
        }
        return next;
      });
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    readDecimals();
    return () => {
      cancelled = true;
    };
  }, [heldVaultAddresses, networkName]);

  const positionSharesDisplay = (position: HeldVaultPosition) => {
    const decimals = shareDecimals[position.vaultAddress];
    if (!isDefined(decimals)) {
      return undefined;
    }
    return formatNumberToLocaleWithMinDecimals(
      getDecimalBalance(position.balance, decimals),
      4,
    );
  };

  useEffect(() => {
    const trimmed = vaultSearch.trim();
    if (isAddress(trimmed)) {
      setVaultAddress(trimmed);
    }
  }, [vaultSearch]);

  const canDeposit =
    isSupported && isDefined(vaultInfo) && isDefined(sellTokenAmount);

  const handleDeposit = () => {
    if (!isDefined(vaultInfo) || !isDefined(sellTokenAmount)) {
      return;
    }
    const extraData: MorphoVaultDepositData = {
      vaultAddress: vaultInfo.vaultAddress,
      vaultVersion: 'V1',
      assetAddress: vaultInfo.assetAddress,
      assetDecimals: vaultInfo.assetDecimals,
      shareDecimals: vaultInfo.shareDecimals,
      sellERC20Amount: sellTokenAmount,
      slippagePercentage,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.MorphoVaultDeposit,
      extraData,
    });
  };

  const onDismissRedeemTokenModal = (token?: ERC20Token) => {
    setRedeemBuyPending(false);
    if (!isDefined(token) || !isDefined(vaultInfo) || !validRedeemShares) {
      return;
    }
    const extraData: MorphoVaultRedeemData = {
      vaultAddress: vaultInfo.vaultAddress,
      vaultVersion: 'V1',
      assetAddress: vaultInfo.assetAddress,
      assetDecimals: vaultInfo.assetDecimals,
      shareDecimals: vaultInfo.shareDecimals,
      sharesAmountString: redeemSharesBaseUnits.toString(),
      buyERC20: token,
      slippagePercentage,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.MorphoVaultRedeem,
      extraData,
    });
  };

  const selectVault = (address: string) => {
    setVaultAddress(address);
  };

  const onSelectAction = (action: VaultAction) => {
    setSelectedAction(action);
    setSellTokenAmount(undefined);
    setRedeemSharesString('');
    setVaultAddress('');
    setVaultSearch('');
  };
  const normalizedVaultAddress = vaultAddress.trim().toLowerCase();

  const renderCallout = (type: CalloutType, text: string) => (
    <InfoCallout type={type} text={text} className={styles.callout} />
  );

  const renderHeader = () => (
    <div className={styles.headerRow}>
      <Text className={styles.headerText}>Morpho Vaults</Text>
      <Text className={styles.headerSubtext}>
        Yield-bearing vaults on Morpho
      </Text>
    </div>
  );

  if (!isSupported) {
    return (
      <div className={styles.pageContainer}>
        <MainPagePaddedContainer maxWidth={760} minWidth={520}>
          {renderHeader()}
          {renderCallout(
            CalloutType.Info,
            `Morpho vaults are only available on Ethereum. ${network.current.publicName} is not supported.`,
          )}
        </MainPagePaddedContainer>
      </div>
    );
  }

  const renderFinderRow = () => (
    <div className={styles.finderRow}>
      <Input
        onChange={e => setVaultSearch(e.target.value)}
        value={vaultSearch}
        placeholder="Search by name or asset, or paste a vault address"
        startIcon={IconType.Search}
        hasError={isDefined(error)}
      />
      <Selector
        containerClassName={styles.modeSelector}
        controlClassName={styles.modeSelectorControl}
        options={VAULT_ACTIONS}
        value={selectedAction}
        placeholder="Select action"
        onValueChange={option => onSelectAction(option as VaultAction)}
        testId="morpho-action-selector"
      />
    </div>
  );

  const renderVaultDirectory = () => (
    <>
      <Checkbox
        checked={showLowQuality}
        handleCheck={() => setShowLowQuality(prev => !prev)}
        label={
          hiddenVaultCount > 0 && !showLowQuality
            ? `Show low-quality vaults (${hiddenVaultCount} hidden)`
            : 'Show low-quality vaults'
        }
        className={styles.qualityToggle}
      />
      {browseLoading && (
        <Text className={styles.hintText}>Loading vaults…</Text>
      )}
      {isDefined(browseError) && (
        <Text className={styles.errorText}>{browseError.message}</Text>
      )}
      {!browseLoading &&
        !isDefined(browseError) &&
        filteredVaults.length === 0 && (
          <Text className={styles.hintText}>No vaults match.</Text>
        )}
      {filteredVaults.length > 0 && (
        <div className={styles.vaultList}>
          {filteredVaults.map(vault => (
            <div
              key={vault.vaultAddress}
              className={cn(styles.vaultRow, {
                [styles.vaultRowSelected]:
                  normalizedVaultAddress === vault.vaultAddress.toLowerCase(),
              })}
              onClick={() => selectVault(vault.vaultAddress)}
            >
              <Text className={styles.vaultRowName}>{vault.name}</Text>
              <Text className={styles.vaultRowMeta}>
                {vault.assetSymbol} · ${formatUsdCompact(vault.tvlUsd)} TVL ·{' '}
                {(vault.netApy * 100).toFixed(2)}% APY
              </Text>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderVaultStatus = () => (
    <>
      {isDefined(error) && (
        <Text className={styles.errorText}>{error.message}</Text>
      )}
      {isLoading && <Text className={styles.hintText}>Reading vault…</Text>}
    </>
  );

  const renderSlippage = () => (
    <div
      className={styles.slippageCard}
      onClick={() => setShowSlippageModal(true)}
    >
      <div className={styles.slippageRow}>
        <Text className={styles.slippageText}>{`Slippage: ${(
          slippagePercentage * 100
        ).toFixed(1)}%`}</Text>
        {renderIcon(IconType.Settings, 20, styleguide.colors.labelSecondary)}
      </div>
    </div>
  );

  const renderDepositCard = () => (
    <div className={styles.formCard}>
      {renderFinderRow()}
      {renderVaultDirectory()}
      {renderVaultStatus()}
      {isDefined(vaultInfo) && (
        <Text className={cn(styles.hintText, 'text-select')}>
          Selected vault: {vaultInfo.vaultAddress}
        </Text>
      )}
      <ERC20AmountsEntry
        transactionType={TransactionType.Swap}
        canSendMultipleTokens={false}
        isRailgunBalance={true}
        initialToken={undefined}
        requiresAddTokens={undefined}
        balanceBucketFilter={BALANCE_BUCKET_FILTER}
        tokenAmounts={sellTokenAmount ? [sellTokenAmount] : []}
        setTokenAmounts={tokenAmounts => setSellTokenAmount(tokenAmounts[0])}
        showAmountEntry={showAmountEntry}
        setShowAmountEntry={setShowAmountEntry}
      />
      {renderSlippage()}
      <div className={styles.actionsRow}>
        <Button
          startIcon={IconType.Receive}
          buttonClassName={styles.actionButton}
          disabled={!canDeposit}
          onClick={handleDeposit}
        >
          Deposit
        </Button>
      </div>
    </div>
  );

  const renderHeldPositions = () => (
    <>
      <Text className={styles.formLabel}>Your vault positions</Text>
      {filteredPositions.length > 0 ? (
        <div className={styles.vaultList}>
          {filteredPositions.map(position => (
            <div
              key={position.vaultAddress}
              className={cn(styles.vaultRow, {
                [styles.vaultRowSelected]:
                  normalizedVaultAddress === position.vaultAddress,
              })}
              onClick={() => selectVault(position.vaultAddress)}
            >
              <Text className={styles.vaultRowName}>{position.name}</Text>
              <Text className={styles.vaultRowMeta}>
                {isDefined(position.assetSymbol)
                  ? `${position.assetSymbol} vault`
                  : 'Morpho vault'}
                {isDefined(positionSharesDisplay(position))
                  ? ` · ${positionSharesDisplay(position)} shares`
                  : ''}
              </Text>
            </div>
          ))}
        </div>
      ) : (
        <Text className={styles.hintText}>
          No Morpho vault shares in your shielded balance. Deposit into a vault
          first.
        </Text>
      )}
    </>
  );

  const renderRedeemCard = () => (
    <div className={styles.formCard}>
      {renderFinderRow()}
      {renderHeldPositions()}
      {renderVaultStatus()}
      {isDefined(vaultInfo) && !holdsSelectedVaultShares && (
        <Text className={styles.hintText}>
          You hold no shares in this vault.
        </Text>
      )}
      {isDefined(vaultInfo) && holdsSelectedVaultShares && (
        <>
          <Text className={styles.formLabel}>
            Vault shares to redeem
            {isDefined(sharesBalanceDisplay)
              ? ` (balance: ${sharesBalanceDisplay})`
              : ''}
          </Text>
          <Input
            onChange={e => setRedeemSharesString(e.target.value)}
            value={redeemSharesString}
            placeholder="0.0"
            type="number"
            rightView={
              isDefined(sharesBalanceDisplay) ? (
                <Button
                  children="MAX"
                  onClick={() => setRedeemSharesString(sharesBalanceDisplay)}
                  buttonClassName={styles.inputInsetButton}
                  textClassName={styles.bottomButtonLabel}
                />
              ) : undefined
            }
          />
          {renderSlippage()}
          <div className={styles.actionsRow}>
            <Button
              startIcon={IconType.Send}
              buttonClassName={styles.actionButton}
              disabled={!validRedeemShares}
              onClick={() => setRedeemBuyPending(true)}
            >
              Redeem
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <MainPagePaddedContainer maxWidth={760} minWidth={520}>
        {renderHeader()}
        {renderCallout(
          CalloutType.Info,
          'Your tokens never leave RAILGUN. Deposits and redemptions each run in one private batch.',
        )}

        {isDeposit ? renderDepositCard() : renderRedeemCard()}
      </MainPagePaddedContainer>
      {showSlippageModal && (
        <SlippageSelectorModal
          isRailgun
          setFinalSlippagePercentage={setSlippagePercentage}
          initialSlippagePercentage={slippagePercentage}
          onClose={() => setShowSlippageModal(false)}
        />
      )}
      {redeemBuyPending && (
        <SelectERC20Modal
          headerTitle="Receive as"
          skipBaseToken={false}
          onDismiss={onDismissRedeemTokenModal}
          isRailgun={true}
          balanceBucketFilter={BALANCE_BUCKET_FILTER}
          purpose={SelectTokenPurpose.Transfer}
          transactionType={TransactionType.Swap}
          hasExistingTokenAmounts={false}
          showAddTokensButton={true}
          useRelayAdaptForBroadcasterFee={false}
        />
      )}
    </div>
  );
};
