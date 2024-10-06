import { pbkdf2 } from "@react-shared";

export const hashPasswordString = (
  password: string,
  salt: string,
  iterations: number
): Promise<string> => {
  return pbkdf2(password, salt, iterations);
};
