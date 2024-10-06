import React from "react";
import { Text, View } from "react-native";
import { ButtonWithTextAndIcon } from "@components/buttons/ButtonWithTextAndIcon/ButtonWithTextAndIcon";
import {
  GradientStyle,
  RailgunGradient,
} from "@components/gradient/RailgunGradient";
import {
  getNetworkFrontendConfig,
  IconPublic,
  IconShielded,
  styleguide,
  useReduxSelector,
  WalletCardSlideItem,
} from "@react-shared";
import { isTightWidth } from "@services/util/screen-dimensions-service";
import { Icon } from "@views/components/icons/Icon";
import { styles } from "./styles";

type Props = {
  item: WalletCardSlideItem;
  onActionShieldTokens: () => void;
  onActionUnshieldERC20s: () => void;
};

export const WalletCardSlideFooter: React.FC<Props> = ({
  item,
  onActionShieldTokens,
  onActionUnshieldERC20s,
}) => {
  const { network } = useReduxSelector("network");
  const { wallets } = useReduxSelector("wallets");

  const textIconColor = styleguide.colors.text();

  const networkName = item.isRailgun
    ? "RAILGUN"
    : network.current.shortPublicName;
  const shieldedStatus = item.isRailgun ? "shielded" : "public";

  const iconTextView = () => {
    return (
      <View style={styles.footerIconText}>
        <View style={styles.footerIcon}>
          <Icon
            source={item.isRailgun ? IconShielded() : IconPublic()}
            color={textIconColor}
            size={18}
          />
        </View>
        <Text
          numberOfLines={3}
          style={[styles.footerText, { color: textIconColor }]}
        >
          {networkName} assets are {shieldedStatus}
          {"."}
        </Text>
      </View>
    );
  };

  const buttonView = () => {
    const action = item.isRailgun
      ? onActionUnshieldERC20s
      : onActionShieldTokens;
    const icon = item.isRailgun ? IconPublic() : IconShielded();
    const title = item.isRailgun ? "Unshield" : "Shield";

    return (
      <ButtonWithTextAndIcon
        onPress={action}
        icon={isTightWidth() ? undefined : icon}
        title={title}
        overrideHeight={44}
        disabled={wallets.active?.isViewOnlyWallet}
      />
    );
  };

  const networkGradient = (): GradientStyle => {
    return {
      ...styleguide.colors.gradients.railgun,
      colors: getNetworkFrontendConfig(network.current.name).gradientColors,
    };
  };

  return (
    <RailgunGradient
      gradient={
        item.isRailgun ? styleguide.colors.gradients.railgun : networkGradient()
      }
      style={styles.footer}
    >
      <View style={styles.footerRow}>
        {iconTextView()}
        {buttonView()}
      </View>
    </RailgunGradient>
  );
};
