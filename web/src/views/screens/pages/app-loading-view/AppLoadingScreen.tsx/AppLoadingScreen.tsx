import React from 'react';
import { FullScreenSpinner } from '@components/loading/FullScreenSpinner/FullScreenSpinner';

type AppLoadingScreenProps = {};

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = () => {
  return (
    <div className="overlay-container">
      <FullScreenSpinner />
    </div>
  );
};
