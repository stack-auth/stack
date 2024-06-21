import * as yup from "yup";

export const yupJson = yup.mixed().nullable().defined().transform((value) => JSON.parse(JSON.stringify(value)));

export const yupJsonValidator = yup.string().test("json", "Invalid JSON format", (value) => {
  if (!value) return true;
  try {
    JSON.parse(value);
    return true;
  } catch (error) {
    return false;
  }
});
