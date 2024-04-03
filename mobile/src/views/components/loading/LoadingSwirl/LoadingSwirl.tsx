import React from 'react';
import { Animated, Image } from 'react-native';
import { ImageSwirl } from '@react-shared';
import { styles } from './styles';

type Props = {
  animate: boolean;
};

const SWIRL_DEFAULT_LOADING_WIDTH_PCT = 100;
const ANIMATION_DURATION = 300;

export const LoadingSwirl: React.FC<Props> = ({ animate }) => {
  const widthPct = new Animated.Value(0);

  if (animate) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(widthPct, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
        Animated.timing(widthPct, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  } else {
    Animated.timing(widthPct, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }

  return (
    <Animated.View
      style={[
        styles.loadingSwirl,
        {
          width: widthPct.interpolate({
            inputRange: [0, 1],
            outputRange: [
              SWIRL_DEFAULT_LOADING_WIDTH_PCT + '%',
              SWIRL_DEFAULT_LOADING_WIDTH_PCT * 1.05 + '%',
            ],
          }),
        },
      ]}
    >
      <Image
        source={ImageSwirl()}
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      />
    </Animated.View>
  );
};
