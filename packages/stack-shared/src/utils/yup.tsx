import * as yup from "yup";

export const yupJson = yup.mixed().nullable().defined().transform((value) => JSON.parse(JSON.stringify(value)));
