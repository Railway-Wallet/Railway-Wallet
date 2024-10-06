import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import React from "react";
import { Text, View } from "react-native";
import { ButtonTextOnly } from "@components/buttons/ButtonTextOnly/ButtonTextOnly";
import {
  ERC20Token,
  formatNumberToLocaleWithMinDecimals,
  formatUnitFromHexStringToLocale,
  getTokenDisplayNameShort,
  TransactionType,
  useERC20Balance,
  useReduxSelector,
} from "@react-shared";
import { ERC20EntryAmountButtonRow } from "../ERC20EntryAmountButtonRow/ERC20EntryAmountButtonRow";
import { SelectTokenInlineButton } from "../SelectTokenInlineButton/SelectTokenInlineButton";
import { styles } from "./styles";

type Props = {
  token: Optional<ERC20Token>;
  isRailgunBalance: boolean;
  transactionType: TransactionType;
  numEntryString: string;
  onTapMaxButton: () => void;
  onTapClearButton: () => void;
  onTapTokenSelector?: () => void;
  updateAmount: (value: string) => void;
  onSaveAmount: () => void;
  error?: Optional<Error>;
  hasValidNumEntry: boolean;
  focused: boolean;
  disableERC20Selection?: boolean;
  balanceBucketFilter: RailgunWalletBalanceBucket[];
};

export const SendERC20sNumberInput: React.FC<Props> = ({
  token,
  isRailgunBalance,
  numEntryString,
  onTapMaxButton,
  onTapClearButton,
  onTapTokenSelector,
  updateAmount,
  onSaveAmount,
  error,
  hasValidNumEntry,
  balanceBucketFilter,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const { tokenBalance } = useERC20Balance(
    wallets.active,
    token,
    isRailgunBalance,
    balanceBucketFilter
  );

  const leftView = () => {
    if (numEntryString.length) {
      return (
        <ButtonTextOnly
          onTap={onTapClearButton}
          title="CLR"
          viewStyle={styles.buttonTextOnlyContent}
          contentStyle={styles.buttonTextOnlyContent}
        />
      );
    }
    return (
      <ButtonTextOnly
        onTap={onTapMaxButton}
        title="MAX"
        viewStyle={styles.buttonTextOnlyContent}
        contentStyle={styles.buttonTextOnlyContent}
      />
    );
  };

  const rightView = () => {
    if (numEntryString.length) {
      return (
        <ButtonTextOnly
          title="Set"
          onTap={onSaveAmount}
          disabled={!hasValidNumEntry}
          viewStyle={styles.buttonTextOnlyContent}
          contentStyle={styles.buttonTextOnlyContent}
        />
      );
    }

    if (!onTapTokenSelector) {
      return (
        <ButtonTextOnly
          title={
            token
              ? getTokenDisplayNameShort(
                  token,
                  wallets.available,
                  network.current.name
                )
              : "N/A"
          }
          viewStyle={styles.buttonTextOnlyContent}
          contentStyle={styles.buttonTextOnlyContent}
        />
      );
    }

    return (
      <SelectTokenInlineButton
        token={token}
        onTapTokenSelector={onTapTokenSelector}
      />
    );
  };

  const balanceText = (token: ERC20Token) => {
    return `${
      isRailgunBalance ? "Private" : "Public"
    } ${getTokenDisplayNameShort(
      token,
      wallets.available,
      network.current.name
    )} balance: ${
      isDefined(tokenBalance)
        ? formatUnitFromHexStringToLocale(tokenBalance, token.decimals)
        : "Loading..."
    }`;
  };

  return (
    <View>
      <View style={styles.wrapper}>
        <ERC20EntryAmountButtonRow
          leftView={leftView}
          rightView={rightView}
          numEntryString={numEntryString}
          updateAmount={updateAmount}
          placeholder={formatNumberToLocaleWithMinDecimals(0, 2)}
        />
      </View>
      {token && (
        <View style={styles.balanceTextWrapper}>
          <Text numberOfLines={1} style={styles.balanceText}>
            {balanceText(token)}
          </Text>
        </View>
      )}
      <View style={styles.errorTextWrapper}>
        {isDefined(error) && (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
            style={styles.errorText}
          >
            {error.message}
          </Text>
        )}
      </View>
    </View>
  );
};
