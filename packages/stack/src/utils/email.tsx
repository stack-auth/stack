import * as yup from "yup";

export function validateEmail(email: string): boolean {
  if (typeof email !== "string") throw new Error("Email must be a string");
  return yup.string().email().isValidSync(email);
};
