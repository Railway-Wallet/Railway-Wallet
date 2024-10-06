export const hexStringToUint8Array = (str: string) => {
  return new Uint8Array(Buffer.from(str, "hex"));
};
