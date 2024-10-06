import { Image, ImageSourcePropType } from "react-native";

export const imageWidthFromDesiredHeight = (
  imageSrc: ImageSourcePropType,
  newHeight: number
): number => {
  const { width: originalWidth, height: originalHeight } =
    Image.resolveAssetSource(imageSrc);

  const ratio = originalWidth / originalHeight;
  return newHeight * ratio;
};

export const imageHeightFromDesiredWidth = (
  imageSrc: ImageSourcePropType,
  newWidth: number
): number => {
  const { width: originalWidth, height: originalHeight } =
    Image.resolveAssetSource(imageSrc);

  const ratio = originalHeight / originalWidth;
  return newWidth * ratio;
};
