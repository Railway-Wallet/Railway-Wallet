import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React, { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import { InfoCallout } from "@components/callouts/InfoCallout/InfoCallout";
import { FooterButtonAndroid } from "@components/footers/FooterButtonAndroid/FooterButtonAndroid";
import { HeaderBackButton } from "@components/headers/headerSideComponents/HeaderBackButton/HeaderBackButton";
import { ERC20AmountsNumPadView } from "@components/views/ERC20AmountsNumPadView/ERC20AmountsNumPadView";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { DAppsStackParamList } from "@models/navigation-models";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  CalloutType,
  CookbookFarmRecipeType,
  ERC20Amount,
  ERC20TokenAddressOnly,
  findMatchingAddedTokenForWallet,
  formatNumberToLocaleWithMinDecimals,
  getFarmActionTitle,
  getTokenDisplayNameShort,
  getTokenIconKeyForVaultType,
  getVaultDisplayName,
  SearchableERC20,
  TransactionType,
  useReduxSelector,
  Vault,
  VaultType,
} from "@react-shared";
import { AddCustomTokenModal } from "@screens/modals/AddCustomTokenModal/AddCustomTokenModal";
import { callActionSheet } from "@services/util/action-sheet-options-service";
import { HapticSurface, triggerHaptic } from "@services/util/haptic-service";
import { AppHeader } from "@views/components/headers/AppHeader/AppHeader";
import { HeaderTextButton } from "@views/components/headers/headerSideComponents/HeaderTextButton/HeaderTextButton";
import { TextEntry } from "@views/components/inputs/TextEntry/TextEntry";
import { styles } from "./styles";

type VaultOption = {
  label: string;
  value: string;
  type: VaultType;
};

type Props = {
  navigation: NavigationProp<DAppsStackParamList, "FarmVaultInitial">;
  route: RouteProp<
    { params: DAppsStackParamList["FarmVaultInitial"] },
    "params"
  >;
};

export const FarmVaultInitial: React.FC<Props> = ({ route, navigation }) => {
  const { cookbookFarmRecipeType, currentToken } = route.params;

  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");
  const { vaults } = useReduxSelector("vaults");

  const { showActionSheetWithOptions } = useActionSheet();

  const isFarmDeposit =
    cookbookFarmRecipeType === CookbookFarmRecipeType.Deposit;
  const headerTitle = getFarmActionTitle(
    network.current.name,
    cookbookFarmRecipeType,
    wallets.available,
    undefined,
    currentToken
  );

  const [erc20Amounts, setERC20Amounts] = useState<ERC20Amount[]>([]);
  const [showAmountEntry, setShowAmountEntry] = useState(true);
  const [selectedVaultOption, setSelectedVaultOption] = useState<VaultOption>();
  const [selectedVault, setSelectedVault] = useState<Vault>();
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);

  const transactionType = isFarmDeposit
    ? TransactionType.FarmDeposit
    : TransactionType.FarmRedeem;
  const isRailgunBalance = true;
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
    [currentToken, networkVaultData?.depositVaultsForToken]
  );

  const getVaultOptionName = (vault: Vault) => {
    return `${getVaultDisplayName(vault.type)} (${vault.name})`;
  };

  const vaultDisplayName = currentVault
    ? getVaultDisplayName(currentVault.type)
    : undefined;
  const currentVaultName = currentVault
    ? getVaultOptionName(currentVault)
    : "Select an option";

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
    [currentVault, isFarmDeposit]
  );
  const vaultERC20AlreadyAdded = useMemo(
    () =>
      tokenToAdd
        ? isDefined(
            findMatchingAddedTokenForWallet(
              tokenToAdd,
              wallets.active,
              networkName
            )
          )
        : false,
    [wallets.active, networkName, tokenToAdd]
  );

  const vaultOptions: Optional<VaultOption[]> = availableVaults?.map(
    (vault: Vault) => {
      const apyPercentage = formatNumberToLocaleWithMinDecimals(
        vault.apy * 100,
        2
      );
      const vaultOptionName = getVaultOptionName(vault);
      return {
        label: `${vaultOptionName}: ${apyPercentage}%`,
        value: vault.id ?? "NO_ID",
        type: vault.type,
      };
    }
  );

  useEffect(() => {
    if (vaultOptions && vaultOptions.length > 0 && !selectedVaultOption) {
      setSelectedVaultOption(vaultOptions[0]);
    }

    const vault = availableVaults?.find(
      (vault) =>
        vault.id === selectedVaultOption?.value &&
        vault.type === selectedVaultOption?.type
    );
    setSelectedVault(vault);
  }, [availableVaults, selectedVaultOption, vaultOptions]);

  const onTapNext = () => {
    if (!currentVault) {
      return;
    }
    if (erc20Amounts.length === 0) {
      return;
    }

    triggerHaptic(HapticSurface.NavigationButton);

    navigation.navigate("FarmVaultConfirm", {
      cookbookFarmRecipeType,
      selectedTokenAmount: erc20Amounts[0],
      selectedVault: currentVault,
    });
  };

  const openAddTokenModal = () => {
    setShowAddTokenModal(true);
  };

  const onTapChangeVault = () => {
    triggerHaptic(HapticSurface.NavigationButton);
    const buttons =
      vaultOptions?.map((v) => {
        return {
          name: v.label,
          action: () => setSelectedVaultOption(v),
        };
      }) ?? [];

    callActionSheet(
      showActionSheetWithOptions,
      "Select farming source",
      buttons
    );
  };

  const tokenToAddInfo: Optional<SearchableERC20> = currentVault
    ? {
        searchStr: "",
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
    networkName
  );
  const addTokenDescription = isFarmDeposit
    ? `When you deposit ${currentTokenName} into this ${vaultDisplayName}, you will receive ${currentVault?.redeemERC20Symbol}, which is redeemable for ${currentTokenName} at an ever-increasing rate.`
    : `When you redeem ${currentTokenName} from this ${vaultDisplayName}, you will receive ${currentVault?.depositERC20Symbol} into your shielded balance.`;

  return (
    <>
      <AppHeader
        title={headerTitle}
        headerLeft={<HeaderBackButton />}
        headerRight={
          <HeaderTextButton
            text="Next"
            onPress={onTapNext}
            disabled={
              showAmountEntry || !currentVault || !vaultERC20AlreadyAdded
            }
          />
        }
      />
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.8}
          onPress={isFarmDeposit ? onTapChangeVault : undefined}
        >
          <TextEntry
            label="Farming source"
            value={currentVaultName}
            iconButtons={[
              isFarmDeposit
                ? {
                    icon: "pencil-outline",
                    onTap: onTapChangeVault,
                  }
                : undefined,
            ]}
            editable={false}
          />
        </TouchableOpacity>
        <ERC20AmountsNumPadView
          transactionType={transactionType}
          canSendMultipleTokens={false}
          disableERC20Selection={true}
          isRailgunBalance={isRailgunBalance}
          balanceBucketFilter={[RailgunWalletBalanceBucket.Spendable]}
          navigationToken={currentToken}
          showAmountEntry={showAmountEntry}
          setShowAmountEntry={setShowAmountEntry}
          erc20Amounts={erc20Amounts}
          setTokenAmounts={setERC20Amounts}
          focused={true}
          onTouchEnd={() => {}}
        />
        {!showAmountEntry && (
          <>
            {!vaultERC20AlreadyAdded ? (
              <>
                <Text style={styles.addTokenDescription}>
                  {addTokenDescription}
                </Text>
                <ButtonWithTextAndIcon
                  icon="plus"
                  title={`Add ${
                    isFarmDeposit
                      ? currentVault?.redeemERC20Symbol
                      : currentVault?.depositERC20Symbol
                  } to wallet`}
                  onPress={() => {
                    triggerHaptic(HapticSurface.SelectItem);
                    openAddTokenModal();
                  }}
                  additionalStyles={styles.addTokenButton}
                />
              </>
            ) : (
              <>
                <InfoCallout
                  type={CalloutType.Secure}
                  text={addTokenDescription}
                  style={styles.infoCalloutReady}
                />
                <FooterButtonAndroid
                  buttonAction={onTapNext}
                  buttonTitle="Next"
                  disabled={!currentVault}
                />
              </>
            )}
          </>
        )}
      </View>
      <AddCustomTokenModal
        initialFullToken={tokenToAddInfo}
        onClose={() => setShowAddTokenModal(false)}
        show={showAddTokenModal}
      />
    </>
  );
};
