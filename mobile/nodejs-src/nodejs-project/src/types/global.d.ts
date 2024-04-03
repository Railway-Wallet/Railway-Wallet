/* eslint-disable no-unused-vars */
declare type Optional<T> = T | undefined;
declare type MapType<T> = Partial<Record<string, T>>;

declare module 'rn-bridge';

declare module 'leveldown-nodejs-mobile' {
  // eslint-disable-next-line import/no-extraneous-dependencies
  import leveldown from 'leveldown';

  // eslint-disable-next-line import/no-default-export
  export default leveldown;
}
