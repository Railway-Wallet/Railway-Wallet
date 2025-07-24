export enum CalloutType {
  Info = 'Info',
  Help = 'Help',
  Warning = 'Warning',
  Secure = 'Secure',
  Insecure = 'Insecure',
  Unlock = 'Unlock',
  Create = 'Create',
}

export type RemoteConfigCallout = {
  message: string;
  type: string
};
