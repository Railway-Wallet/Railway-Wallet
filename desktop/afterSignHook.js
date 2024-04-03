// "afterSign": "./afterSignHook.js",

require('dotenv').config();
const fs = require('fs');
const path = require('path');
var electron_notarize = require('@electron/notarize');

module.exports = async function (params) {
  if (process.platform !== 'darwin') {
    return;
  }

  console.log('afterSign hook triggered', params);

  let appId = 'com.railway.rtp';

  let appPath = path.join(
    params.appOutDir,
    `${params.packager.appInfo.productFilename}.app`,
  );
  if (!fs.existsSync(appPath)) {
    console.log('skip');
    return;
  }

  console.log(`Notarizing ${appId} found at ${appPath}`);

  try {
    await electron_notarize.notarize({

      appBundleId: appId,
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.TEAM_ID
    });
  } catch (error) {
    console.error(error);
  }

  console.log(`Done notarizing ${appId}`);
};
