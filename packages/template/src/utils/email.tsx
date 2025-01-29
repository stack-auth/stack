import { emailSchema } from "@stackframe/stack-shared/dist/schema-fields";

export function validateEmail(email: string): boolean {
  if (typeof email !== "string") throw new Error("Email must be a string");
  return emailSchema.isValidSync(email);
};
