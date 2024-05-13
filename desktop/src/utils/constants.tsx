const isNpmStartBuild = process.env.NODE_ENV === 'development';

export class Constants {
  static readonly DEV_MODE =
    isNpmStartBuild || process.env.REACT_APP_DEV_BUILD === '1';
  static readonly STAG_MODE = process.env.REACT_APP_STAG_BUILD === '1';

  static readonly USE_LOCAL_REMOTE_CONFIG_IN_DEV = false;
  static readonly SHOW_RELAYER_OVERRIDE_IN_DEV = false;
  static readonly REFRESH_TX_HISTORY_EVERY_LOAD_IN_DEV = false;
  static readonly PERFORM_FULL_BALANCE_REFRESH_ON_BUTTON_IN_DEV = false;
  static readonly OVERRIDE_PROD_TEST_FOR_DEV = false;
  static readonly ENABLE_MEMO_FIELD = true;
  static readonly SHOW_VERBOSE_RELAYER_ERRORS_IN_PROD = true;
  static readonly SHOW_FARM_FEATURE = true;

  static readonly RAILWAY_IOS_APP_STORE_URL =
    'https://apps.apple.com/us/app/railway-private-defi-wallet/id6444296719';
  static readonly RAILWAY_ANDROID_GOOGLE_PLAY_URL =
    'https://play.google.com/store/apps/details?id=com.railway.rtp';
  static readonly ELECTRON_DOWNLOAD_URL =
    'https://github.com/Railway-Wallet/Railway-Wallet/releases';

  static readonly RAILWAY_USER_GUIDE = 'https://help.railway.xyz';
  static readonly RAILWAY_DOWNLOADS_PAGE = 'https://railway.xyz/download';
  static readonly RAILWAY_SUPPORT_TELEGRAM = 'https://t.me/railwaywallet';
  static readonly ABOUT_RAILGUN_URL = 'https://railgun.org';
  static readonly DESKTOP_DOWNLOADS_URL =
    'https://github.com/Railway-Wallet/Railway-Wallet/releases';
  static readonly RAILGUN_FAQ_URL = 'https://railgun.org/#/faq';
  static readonly PRIVACY_POLICY_URL = 'https://railway.xyz/privacy.html';
  static readonly TERMS_URL = 'https://railway.xyz/terms.html';
  static readonly VIEW_ONLY_WALLETS_URL =
    'https://help.railway.xyz/setup/view-only-wallets';

  static readonly PROCESSING_PROCESS_TIMEOUT = 1000;
  static readonly PROCESSING_CLOSE_SCREEN_SUCCESS_TIMEOUT = 1800;
  static readonly PROCESSING_CLOSE_SCREEN_ERROR_TIMEOUT = 1500;

  static readonly AVAILABLE_WALLETS = 'AVAILABLE_WALLETS';
  static readonly HAS_WALLETS = 'HAS_WALLETS';
  static readonly PASSWORD_HASH_STORED = 'PASSWORD_HASH_STORED';
  static readonly PASSWORD_SALT = 'PASSWORD_SALT';
  static readonly HAS_SHOWN_WARNING_FIRST_PRIVATE_SWAP =
    'HAS_SHOWN_WARNING_FIRST_PRIVATE_SWAP';
  static readonly HAS_SHOWN_UNSUPPORTED_BROWSER_WARNING =
    'HAS_SHOWN_UNSUPPORTED_BROWSER_WARNING';
  static readonly HAS_COMPLETED_FIRST_SHIELD = 'HAS_COMPLETED_FIRST_SHIELD';
  static readonly POI_CUSTOM_LISTS = 'POI_CUSTOM_LISTS';

  static readonly SHOULD_WIPE_DEVICES = false;
}
