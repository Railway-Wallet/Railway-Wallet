import { isDefined, versionCompare } from '@railgun-community/shared-models';
import { logDevError, RemoteConfig } from '@react-shared';
import { isElectron } from '@utils/user-agent';

export type DesktopBuild = {
  name: string;
  url: string;
};

export const needsVersionUpdate = (remoteConfig: RemoteConfig): boolean => {
  const { minVersionNumberWeb } = remoteConfig;

  const appVersionNumber = process.env.REACT_APP_VERSION;
  return versionCompare(appVersionNumber, minVersionNumberWeb) < 0;
};

export const fetchDesktopDownloadBuilds = async (): Promise<DesktopBuild[]> => {
  try {
    const data = await fetch(
      `https://api.github.com/repos/Railway-Wallet/Railway-Wallet/releases/latest`,
    ).then(response => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch latest release: ${response.statusText}`,
        );
      }
      return response.json();
    });

    if (isDefined(data)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return data.assets.map((build: any) => {
        return {
          name: build.name,
          url: build.browser_download_url,
        };
      });
    }

    return [];
  } catch (cause) {
    const error = new Error('Error getting desktop download assets', {
      cause,
    });
    logDevError(error);

    return [];
  }
};

export const newVersionAvailable = async (): Promise<boolean> => {
  try {
    const data = await fetch(
      `https://api.github.com/repos/Railway-Wallet/Railway-Wallet/releases/latest`,
    ).then(response => {
      if (!response.ok) {
        throw new Error(
          `Failed to fetch latest release: ${response.statusText}`,
        );
      }
      return response.json();
    });

    if (isDefined(data)) {
      const latestVersion: string = data.tag_name;
      const currentVersion = process.env.REACT_APP_VERSION;
      const isNewVersionAvailable =
        versionCompare(currentVersion, latestVersion.substring(1)) < 0;

      if (isNewVersionAvailable) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const availableBuilds: string[] = data.assets.map(
          (build: any) => build.name,
        );

        if (isElectron()) {
          const isWin = process.platform === 'win32';
          const isLinux = process.platform === 'linux';
          const isMac = process.platform === 'darwin';

          if (isWin) {
            return availableBuilds.some(build => build.endsWith('.exe'));
          }

          if (isMac) {
            return availableBuilds.some(build => build.endsWith('.dmg'));
          }

          if (isLinux) {
            return availableBuilds.some(
              build =>
                build.endsWith('.snap') ||
                build.endsWith('.AppImage') ||
                build.endsWith('.deb') ||
                build.endsWith('.pacman') ||
                build.endsWith('.rpm'),
            );
          }

          return isNewVersionAvailable;
        }

        return isNewVersionAvailable;
      }
    }

    return false;
  } catch (cause) {
    const error = new Error('Error getting new version available', {
      cause,
    });
    logDevError(error);

    return false;
  }
};
