/* eslint-disable @typescript-eslint/no-unused-vars */
import { Linking, Platform } from "react-native";
import { logDev, logDevError } from "@react-shared";
const APP_STORE_LINK = `itms-apps://apps.apple.com/app/id1598167965?action=write-review`;
const PLAY_STORE_LINK = `market://details?id=com.railway.rtp`;

export const openAppReviewLink = async () => {
  return false;
};

export const triggerInAppReview = () => {
  try {
    throw new Error("Missing store review plugin.");
  } catch (err) {
    logDevError(new Error("Cannot trigger in-app review", { cause: err }));
  }
};
