import React from "react";
import { View } from "react-native";
import { Button, IconButton } from "react-native-paper";
import { ListHeader } from "@components/list/ListHeader/ListHeader";
import { SpinnerCubes } from "@components/loading/SpinnerCubes/SpinnerCubes";
import { IconPublic, IconShielded, styleguide } from "@react-shared";
import { styles } from "./styles";

type Props = {
  isRailgun: boolean;
  isRefreshing: boolean;
  onTapAddToken: () => void;
  onRefresh: () => void;
  onEnableDiscreetMode: () => void;
  onDisableDiscreetMode: () => void;
  discreet: boolean;
};

export const ERC20TokenListHeader: React.FC<Props> = ({
  isRailgun,
  isRefreshing,
  onTapAddToken,
  onRefresh,
  onEnableDiscreetMode,
  onDisableDiscreetMode,
  discreet,
}) => {
  const title = isRailgun ? "Shielded Tokens" : "Public Tokens";

  return (
    <ListHeader
      text={title}
      titleIconSource={isRailgun ? IconShielded() : IconPublic()}
      rightView={
        <View style={styles.buttonsContainer}>
          <Button
            onPress={discreet ? onDisableDiscreetMode : onEnableDiscreetMode}
            style={styles.addButton}
            labelStyle={styles.discreetButtonText}
            compact
          >
            {discreet ? "***" : "123"}
          </Button>
          {isRefreshing ? (
            <View style={[styles.addButton, styles.spinner]}>
              <SpinnerCubes size={23} />
            </View>
          ) : (
            <IconButton
              onPress={onRefresh}
              iconColor={styleguide.colors.text()}
              style={styles.addButton}
              icon="refresh"
              size={24}
            />
          )}
          <IconButton
            onPress={onTapAddToken}
            iconColor={styleguide.colors.text()}
            style={styles.addButton}
            icon="plus"
            size={24}
          />
        </View>
      }
    />
  );
};
