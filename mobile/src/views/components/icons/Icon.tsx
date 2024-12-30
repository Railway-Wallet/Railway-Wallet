import React from 'react';
import { Image, ImageRequireSource, ImageURISource } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
const MaterialIcon = MaterialCommunityIcons as any;

export type IconSource =
  | string
  | ImageURISource
  | ImageRequireSource
  | { testUri: string; uri: string };

type Props = {
  source: IconSource;
  size: number;
  color?: string;
};

export const Icon: React.FC<Props> = ({ source, size, color }) => {
  const isImageSource = typeof source !== 'string';

  if (isImageSource) {
    return (
      <Image
        source={source as ImageURISource | ImageRequireSource}
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
          tintColor: color,
        }}
      />
    );
  } else {
    return <MaterialIcon name={source as string} size={size} color={color} />;
  }
};
