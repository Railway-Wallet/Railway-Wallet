const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { signAsync } = require('@electron/osx-sign');

const BIOMETRIC_HELPER_NAME = 'RailwayBiometricKeychain';
const APP_IDENTIFIER = 'com.railway.rtp';

const teamIdentifierForIdentity = identity => {
  const identities = execFileSync(
    'security',
    ['find-identity', '-v', '-p', 'codesigning'],
    { encoding: 'utf8' }
  );
  const matchingIdentity = identities
    .split('\n')
    .find(line => line.includes(identity));
  const match = matchingIdentity?.match(/\(([A-Z0-9]{10})\)"?\s*$/);
  if (!match) {
    throw new Error('Could not determine Apple team identifier.');
  }
  return match[1];
};

const createHelperEntitlements = identity => {
  const teamIdentifier = teamIdentifierForIdentity(identity);
  const applicationIdentifier = `${teamIdentifier}.${APP_IDENTIFIER}`;
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'railway-biometric-entitlements-')
  );
  const entitlementsPath = path.join(directory, 'entitlements.plist');
  fs.writeFileSync(
    entitlementsPath,
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.application-identifier</key>
  <string>${applicationIdentifier}</string>
  <key>com.apple.developer.team-identifier</key>
  <string>${teamIdentifier}</string>
  <key>keychain-access-groups</key>
  <array>
    <string>${applicationIdentifier}</string>
  </array>
</dict>
</plist>
`
  );
  return { directory, entitlementsPath };
};

module.exports = async options => {
  if (!options.identity) {
    return;
  }

  const { directory, entitlementsPath } = createHelperEntitlements(
    options.identity
  );
  const defaultOptionsForFile = options.optionsForFile;
  options.optionsForFile = async filePath => {
    const fileOptions = defaultOptionsForFile
      ? await defaultOptionsForFile(filePath)
      : {};
    if (path.basename(filePath) !== BIOMETRIC_HELPER_NAME) {
      return fileOptions;
    }
    return {
      ...fileOptions,
      entitlements: entitlementsPath,
    };
  };

  try {
    await signAsync(options);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};
