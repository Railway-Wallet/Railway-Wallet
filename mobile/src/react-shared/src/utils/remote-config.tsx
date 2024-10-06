import { ReactConfig } from "../config/react-config";
import DEV_URL from "./remote-config-dev";
import PROD_URL from "./remote-config-prod";

export const getRemoteConfigPath = (): string =>
  ReactConfig.IS_DEV && DEV_URL ? DEV_URL : PROD_URL;
