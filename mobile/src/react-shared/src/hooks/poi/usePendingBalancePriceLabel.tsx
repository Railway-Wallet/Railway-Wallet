import {
  isDefined,
  RailgunWalletBalanceBucket,
} from "@railgun-community/shared-models";
import { ERC20Token, SearchableERC20 } from "../../models/token";
import { AppSettingsService } from "../../services";
import { formatNumberToLocaleWithMinDecimals } from "../../utils";
import { isNonSpendableBucket } from "../../utils/util";
import { useTotalBalanceCurrency } from "../balances";
import { useReduxSelector } from "../hooks-redux";

export const usePendingBalancePriceLabel = (
  isRailgun: boolean,
  token?: ERC20Token | SearchableERC20
) => {
  let pendingBalancePriceLabel: Optional<string>;
  const { network } = useReduxSelector("network");

  const { totalBalanceCurrency: pendingBalanceCurrency } =
    useTotalBalanceCurrency(
      isRailgun,
      Object.values(RailgunWalletBalanceBucket).filter((bucket) =>
        isNonSpendableBucket(bucket)
      ),
      token
    );

  if (
    isDefined(pendingBalanceCurrency) &&
    (pendingBalanceCurrency > 0 || network.current.isTestnet === true)
  ) {
    if (pendingBalanceCurrency > 0 && pendingBalanceCurrency < 0.01) {
      pendingBalancePriceLabel = `<${AppSettingsService.currency.symbol}0.01`;
    } else {
      pendingBalancePriceLabel = `${
        AppSettingsService.currency.symbol
      }${formatNumberToLocaleWithMinDecimals(pendingBalanceCurrency, 2)}`;
    }
  }

  return { pendingBalancePriceLabel };
};
