import { localDecimalSymbol } from "@react-shared";

export class Constants {
  static readonly REMOTE_RESOURCES_URL = "https://beacon.railgun.ch";

  static readonly SKIP_LOCKED_SCREEN_IN_DEV = false;
  static readonly USE_LOCAL_REMOTE_CONFIG_IN_DEV = false;
  static readonly REFRESH_TX_HISTORY_EVERY_LOAD_IN_DEV = false;

  static readonly ANDROID_USE_RPC_WAKU = true;
  static readonly IOS_USE_RPC_WAKU = false;

  static readonly ENABLE_MEMO_FIELD = true;

  static readonly ENABLE_SWAPS_PROD_IOS = false;

  static readonly RAILWAY_SUPPORT_TELEGRAM = "https://t.me/railwaywallet";
  static readonly ABOUT_RAILGUN_URL = "https://railgun.org";
  static readonly RAILGUN_FAQ_URL = "https://railgun.org/#/faq";
  static readonly RAILWAY_APP_STORE =
    "https://apps.apple.com/us/app/railway-private-defi-wallet/id6444296719";
  static readonly RAILWAY_PLAY_STORE =
    "https://play.google.com/store/apps/details?id=com.railway.rtp";
  static readonly VIEW_ONLY_WALLETS_URL =
    "https://help.railway.xyz/setup/view-only-wallets";

  static readonly PROCESSING_PROCESS_TIMEOUT = 1000;
  static readonly PROCESSING_CLOSE_SCREEN_SUCCESS_TIMEOUT = 3000;
  static readonly PROCESSING_CLOSE_SCREEN_ERROR_TIMEOUT = 3000;

  static readonly SECURITY_PIN = "SECURITY_PIN";
  static readonly SECURITY_HAS_PIN = "SECURITY_HAS_PIN";
  static readonly PASSWORD_HASH_STORED = "PASSWORD_HASH_STORED";
  static readonly PASSWORD_SALT = "PASSWORD_SALT";

  static readonly ENABLED_STORAGE_VALUE = "1";
  static readonly DISABLED_STORAGE_VALUE = "0";

  static readonly MAX_REMINDERS_SET_PIN = 2;

  static readonly BIOMETRICS_ENABLED = "BIOMETRICS_ENABLED";
  static readonly DB_ENCRYPTION_KEY = "DB_ENCRYPTION_KEY";
  static readonly WALLET_MNEMONIC_KEY = "WALLET_MNEMONIC_KEY";
  static readonly NUM_REMINDERS_SET_PIN = "NUM_REMINDERS_SET_PIN";
  static readonly HAS_SHOWN_WARNING_FIRST_PRIVATE_SWAP =
    "HAS_SHOWN_WARNING_FIRST_PRIVATE_SWAP";
  static readonly HAS_COMPLETED_FIRST_SHIELD = "HAS_COMPLETED_FIRST_SHIELD";
  static readonly DEFAULT_AUTH_KEY = "6e77d809als0a0w9efh";

  static readonly SHOULD_WIPE_DEVICES = false;

  static readonly DECIMAL_SYMBOL = localDecimalSymbol();
}

export const COMMON_HIT_SLOP = {
  top: 10,
  left: 10,
  bottom: 10,
  right: 10,
};
