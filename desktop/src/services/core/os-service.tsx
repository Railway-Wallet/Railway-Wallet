export enum OSType {
  MacSilicon = 'MacSilicon',
  MacIntel = 'MacIntel',
  MacGeneric = 'MacGeneric',
  Windows = 'Windows',
  LinuxGeneric = 'LinuxGeneric',
  LinuxSnap = 'LinuxSnap',
  LinuxAppImage = 'LinuxAppImage',
  LinuxDebian = 'LinuxDebian',
  LinuxPacman = 'LinuxPacman',
  LinuxRPM = 'LinuxRPM',
}

export const getOSType = (): Optional<OSType> => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('win')) {
    return OSType.Windows;
  } else if (userAgent.includes('mac')) {
    return OSType.MacGeneric;
  } else if (userAgent.includes('linux')) {
    if (userAgent.includes('snap')) {
      return OSType.LinuxSnap;
    } else if (userAgent.includes('appimage')) {
      return OSType.LinuxAppImage;
    } else if (userAgent.includes('deb')) {
      return OSType.LinuxDebian;
    } else if (userAgent.includes('pacman')) {
      return OSType.LinuxPacman;
    } else if (userAgent.includes('rpm')) {
      return OSType.LinuxRPM;
    } else {
      return OSType.LinuxGeneric;
    }
  }

  return undefined;
};
