import { isDefined } from "@railgun-community/shared-models";
import RNShare, { ShareOptions } from "react-native-share";
import { logDevError } from "@react-shared";

export const shareMessage = async (text: string) => {
  const options: ShareOptions = {
    message: text,
  };
  await RNShare.open(options).catch((err) => {
    if (isDefined(err)) {
      logDevError(err);
    }
  });
};
