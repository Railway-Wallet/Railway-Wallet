// "afterSign": "./afterSignHook.js",

require('dotenv').config();
const fs = require('fs');
const path = require('path');
var electron_notarize = require('@electron/notarize');

module.exports = async function (params) {
  if (process.platform !== 'darwin') {
    return;
  }

  console.log('Notarizing triggered at afterSignHook.js:', params);

  const appId = 'com.railway.rtp';
  const keychainProfile = process.env.KEYCHAIN_PROFILE;
  const appPath = path.join(
    params.appOutDir,
    `${params.packager.appInfo.productFilename}.app`,
  );

  if (!fs.existsSync(appPath)) {
    console.log('skip');
    return;
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    // NOTE: Credentials must be loaded into local keychain before attempting notarization. See details at https://github.com/electron/notarize?tab=readme-ov-file#usage-with-keychain-credentials
    await electron_notarize.notarize({ appPath, keychainProfile });
  } catch (error) {
    console.error('Error notarizing at afterSignHook.js:', error);
  }

  console.log(`Done notarizing ${appId}`);
};
