export const stringifySafe = (obj: object) => {
  return JSON.stringify(obj, (key, value) =>
    typeof value === "bigint" ? value.toString(10) : value
  );
};
