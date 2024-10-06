import * as fs from "react-native-fs";

export const fileExists = (path: string) => {
  try {
    return fs.exists(path);
  } catch (_err) {
    return false;
  }
};
