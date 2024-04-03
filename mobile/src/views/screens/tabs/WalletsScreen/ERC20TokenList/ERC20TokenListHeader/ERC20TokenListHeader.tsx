import React from 'react';
import { View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { ListHeader } from '@components/list/ListHeader/ListHeader';
import { SpinnerCubes } from '@components/loading/SpinnerCubes/SpinnerCubes';
import { IconPublic, IconShielded, styleguide } from '@react-shared';
import { styles } from './styles';

type Props = {
  isRailgun: boolean;
  isRefreshing: boolean;
  onTapAddToken: () => void;
  onRefresh: () => void;
};

export const ERC20TokenListHeader: React.FC<Props> = ({
  isRailgun,
  isRefreshing,
  onTapAddToken,
  onRefresh,
}) => {
  const title = isRailgun ? 'Shielded Tokens' : 'Public Tokens';

  return (
    <ListHeader
      text={title}
      titleIconSource={isRailgun ? IconShielded() : IconPublic()}
      rightView={
        <View style={styles.buttonsContainer}>
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
