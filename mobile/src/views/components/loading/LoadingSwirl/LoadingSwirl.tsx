import React from 'react';
import { Image, View } from 'react-native';
import loading from '@assets/animations/loading.gif';
import { SpinnerCubes } from '../SpinnerCubes/SpinnerCubes';
import { styles } from './styles';

export const LoadingSwirl: React.FC = () => {
  const useSpinner = true;

  return (
    <View style={styles.loadingContainer}>
      {useSpinner ? (
        <SpinnerCubes size={24} style={styles.spinner} />
      ) : (
        <Image source={loading} style={styles.loading} resizeMode="contain" />
      )}
    </View>
  );
};
