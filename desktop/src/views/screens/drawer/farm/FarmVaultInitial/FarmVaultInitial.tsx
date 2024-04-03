import {
  isDefined,
  RailgunWalletBalanceBucket,
} from '@railgun-community/shared-models';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertProps,
  GenericAlert,
} from '@components/alerts/GenericAlert/GenericAlert';
import { ERC20AmountsEntry } from '@components/amounts-entry/ERC20AmountsEntry';
import { Button } from '@components/Button/Button';
import { InfoCallout } from '@components/InfoCallout/InfoCallout';
import { Text } from '@components/Text/Text';
import {
  DrawerName,
  EVENT_OPEN_DRAWER_WITH_DATA,
  FarmVaultData,
} from '@models/drawer-types';
import {
  CalloutType,
  CookbookFarmRecipeType,
  ERC20Amount,
  ERC20Token,
  ERC20TokenAddressOnly,
  findMatchingAddedTokenForWallet,
  formatNumberToLocaleWithMinDecimals,
  getTokenDisplayNameShort,
  getTokenIconKeyForVaultType,
  getVaultDisplayName,
  getVaultMoreInfoLink,
  SearchableERC20,
  TransactionType,
  useAppDispatch,
  useReduxSelector,
  Vault,
  VaultType,
} from '@react-shared';
import { drawerEventsBus } from '@services/navigation/drawer-events';
import { createExternalSiteAlert } from '@utils/alerts';
import { Selector } from '@views/components/Selector/Selector';
import {
  FarmVaultConfirmData,
  FarmVaultView,
  FarmVaultViewData,
} from '../FarmVaultFlow/FarmVaultFlow';
import styles from './FarmVaultInitial.module.scss';

type VaultOption = {
  label: string;
  value: string;
  type: VaultType;
};

type Props = {
  cookbookFarmRecipeType: CookbookFarmRecipeType;
  currentToken: ERC20Token;
  initialTokenAmount: Optional<ERC20Amount>;
  initialVault: Optional<Vault>;
  handleSetView: (view: FarmVaultView, data: FarmVaultViewData) => void;
};

export const FarmVaultInitial = ({
  cookbookFarmRecipeType,
  initialVault,
  initialTokenAmount,
  currentToken,
  handleSetView,
}: Props) => {
  const { network } = useReduxSelector('network');
  const { wallets } = useReduxSelector('wallets');
  const { vaults } = useReduxSelector('vaults');
  const dispatch = useAppDispatch();

  const [alert, setAlert] = useState<AlertProps | undefined>(undefined);

  const [selectedTokenAmount, setSelectedTokenAmount] =
    useState<Optional<ERC20Amount>>(initialTokenAmount);
  const [selectedVaultOption, setSelectedVaultOption] = useState<VaultOption>();
  const [selectedVault, setSelectedVault] =
    useState<Optional<Vault>>(initialVault);

  const [showAmountEntry, setShowAmountEntry] = useState(
    !isDefined(initialTokenAmount),
  );

  const isFarmDeposit =
    cookbookFarmRecipeType === CookbookFarmRecipeType.Deposit;
  const transactionType = isFarmDeposit
    ? TransactionType.FarmDeposit
    : TransactionType.FarmRedeem;
  const isRailgunBalance = true;
  const balanceBucketFilter = [RailgunWalletBalanceBucket.Spendable];
  const networkName = network.current.name;
  const networkVaultData = vaults.forNetwork[networkName];
  const currentVault = isFarmDeposit
    ? selectedVault
    : networkVaultData?.redeemVaultForToken[currentToken.address.toLowerCase()];
  const availableVaults = useMemo(
    () =>
      networkVaultData?.depositVaultsForToken[
        currentToken.address.toLowerCase()
      ]?.list,
    [currentToken, networkVaultData?.depositVaultsForToken],
  );
  const vaultDisplayName = currentVault
    ? getVaultDisplayName(currentVault.type)
    : undefined;
  const tokenToAdd: Optional<ERC20TokenAddressOnly> = useMemo(
    () =>
      currentVault
        ? isFarmDeposit
          ? {
              isAddressOnly: true,
              isBaseToken: false,
              address: currentVault.redeemERC20Address,
              decimals: currentVault.redeemERC20Decimals,
            }
          : {
              isAddressOnly: true,
              isBaseToken: false,
              address: currentVault.depositERC20Address,
              decimals: currentVault.depositERC20Decimals,
            }
        : undefined,
    [currentVault, isFarmDeposit],
  );
  const vaultERC20AlreadyAdded = useMemo(
    () =>
      tokenToAdd
        ? isDefined(
            findMatchingAddedTokenForWallet(
              tokenToAdd,
              wallets.active,
              networkName,
            ),
          )
        : false,
    [networkName, tokenToAdd, wallets.active],
  );

  const getVaultOptionName = (vault: Vault) => {
    return `${getVaultDisplayName(vault.type)} (${vault.name})`;
  };

  const vaultOptions: Optional<VaultOption[]> = availableVaults?.map(
    (vault: Vault) => {
      const apyPercentage = formatNumberToLocaleWithMinDecimals(
        vault.apy * 100,
        2,
      );
      const vaultOptionName = getVaultOptionName(vault);
      return {
        label: `${vaultOptionName}: ${apyPercentage}%`,
        value: vault.id ?? 'NO_ID',
        type: vault.type,
      };
    },
  );

  useEffect(() => {
    if (vaultOptions && vaultOptions.length > 0 && !selectedVaultOption) {
      setSelectedVaultOption(vaultOptions[0]);
    }

    const vault = availableVaults?.find(
      vault =>
        vault.id === selectedVaultOption?.value &&
        vault.type === selectedVaultOption?.type,
    );
    setSelectedVault(vault);
  }, [availableVaults, selectedVaultOption, vaultOptions]);

  const handleNextStep = () => {
    if (!selectedTokenAmount || !currentVault) {
      return;
    }

    const data: FarmVaultConfirmData = {
      selectedTokenAmount,
      selectedVault: currentVault,
    };
    handleSetView(FarmVaultView.CONFIRM, data);

    const drawerFarmVaultData: FarmVaultData = {
      currentToken,
      cookbookFarmRecipeType,
      vault: currentVault,
    };
    drawerEventsBus.dispatch(EVENT_OPEN_DRAWER_WITH_DATA, {
      drawerName: DrawerName.FarmVault,
      extraData: drawerFarmVaultData,
    });
  };

  const goToVaultInfo = () => {
    if (!currentVault) {
      return;
    }
    const vaultInfoLink = getVaultMoreInfoLink(currentVault);
    createExternalSiteAlert(vaultInfoLink, setAlert, dispatch);
  };

  const tokenToAddInfo: Optional<SearchableERC20> = currentVault
    ? {
        searchStr: '',
        address: isFarmDeposit
          ? currentVault.redeemERC20Address.toLowerCase()
          : currentVault.depositERC20Address.toLowerCase(),
        name: `${currentVault.name} (${vaultDisplayName})`,
        symbol: isFarmDeposit
          ? currentVault.redeemERC20Symbol
          : currentVault.depositERC20Symbol,
        decimals: isFarmDeposit
          ? currentVault.redeemERC20Decimals
          : currentVault.depositERC20Decimals,
        isBaseToken: false,
        icon: getTokenIconKeyForVaultType(currentVault.type),
      }
    : undefined;

  const currentTokenName = getTokenDisplayNameShort(
    currentToken,
    wallets.available,
    networkName,
  );
  const addTokenDescription = isFarmDeposit
    ? `When you deposit ${currentTokenName} into this ${vaultDisplayName}, you will receive ${currentVault?.redeemERC20Symbol}, which is redeemable for ${currentTokenName} at an ever-increasing rate.`
    : `When you redeem ${currentTokenName} from this ${vaultDisplayName}, you will receive ${currentVault?.depositERC20Symbol} into your shielded balance.`;
  const headerText = isFarmDeposit
    ? `Select a farming source and amount of shielded tokens to deposit.`
    : `Select an amount of shielded tokens to redeem.`;

  return (
    <>
      <div className={styles.sendInitialContainer}>
        <Text className={styles.description}>{headerText}</Text>
        {isFarmDeposit && (
          <>
            <Text className={styles.farmingSourceLabel}>Farming source:</Text>
            <Selector
              options={vaultOptions ?? []}
              value={selectedVaultOption}
              placeholder="Select vault"
              onValueChange={option => {
                setSelectedVaultOption(option as VaultOption);
              }}
              testId="vault-selector"
            />
            {currentVault && (
              <div className={styles.farmingSourceMoreInfoLinkContainer}>
                <Text
                  className={styles.farmingSourceMoreInfoLink}
                  onClick={goToVaultInfo}
                >
                  View {getVaultDisplayName(currentVault.type)} details
                </Text>
              </div>
            )}
          </>
        )}
        <ERC20AmountsEntry
          transactionType={transactionType}
          canSendMultipleTokens={false}
          isRailgunBalance={isRailgunBalance}
          balanceBucketFilter={balanceBucketFilter}
          initialToken={currentToken}
          disableERC20Selection={true}
          requiresAddTokens={
            selectedTokenAmount && !vaultERC20AlreadyAdded && tokenToAddInfo
              ? [tokenToAddInfo]
              : undefined
          }
          requiresAddTokenDescription={addTokenDescription}
          tokenAmounts={selectedTokenAmount ? [selectedTokenAmount] : []}
          setTokenAmounts={tokenAmounts => {
            if (!tokenAmounts.length) {
              setSelectedTokenAmount(undefined);
              return;
            }
            setSelectedTokenAmount(tokenAmounts[0]);
          }}
          showAmountEntry={showAmountEntry}
          setShowAmountEntry={setShowAmountEntry}
        />
        {selectedTokenAmount && vaultERC20AlreadyAdded && (
          <>
            <InfoCallout
              type={CalloutType.Secure}
              text={addTokenDescription}
              className={styles.infoCalloutReady}
            />
            <Button
              buttonClassName={styles.nextButton}
              textClassName={styles.nextButtonText}
              onClick={handleNextStep}
              testId="send-erc20-next-button"
            >
              Next
            </Button>
          </>
        )}
      </div>
      {alert && <GenericAlert {...alert} />}
    </>
  );
};
