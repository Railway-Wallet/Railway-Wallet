import { ImageSourcePropType } from "react-native";
import { DAppsParams } from "./navigation-models";

export type DAppSettings = {
  title: string;
  description: string;
  icon: ImageSourcePropType | string;
  routeName: keyof DAppsParams;
  enabled: boolean;
};
