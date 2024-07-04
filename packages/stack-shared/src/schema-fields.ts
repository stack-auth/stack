import * as yup from "yup";

declare const StackAdaptSentinel: unique symbol;
export type StackAdaptSentinel = typeof StackAdaptSentinel;

// Built-in replacements
/* eslint-disable no-restricted-syntax */
export function yupString<A extends string, B extends yup.Maybe<yup.AnyObject> = yup.AnyObject>(...args: Parameters<typeof yup.string<A, B>>) {
  return yup.string(...args);
}
export function yupNumber<A extends number, B extends yup.Maybe<yup.AnyObject> = yup.AnyObject>(...args: Parameters<typeof yup.number<A, B>>) {
  return yup.number(...args);
}
export function yupBoolean<A extends boolean, B extends yup.Maybe<yup.AnyObject> = yup.AnyObject>(...args: Parameters<typeof yup.boolean<A, B>>) {
  return yup.boolean(...args);
}
export function yupDate<A extends Date, B extends yup.Maybe<yup.AnyObject> = yup.AnyObject>(...args: Parameters<typeof yup.date<A, B>>) {
  return yup.date(...args);
}
export function yupMixed<A extends {}>(...args: Parameters<typeof yup.mixed<A>>) {
  return yup.mixed(...args);
}
export function yupArray<A extends yup.Maybe<yup.AnyObject> = yup.AnyObject, B = any>(...args: Parameters<typeof yup.array<A, B>>) {
  return yup.array(...args);
}
export function yupObject<A extends yup.Maybe<yup.AnyObject>, B extends yup.ObjectShape>(...args: Parameters<typeof yup.object<A, B>>) {
  const object = yup.object(...args).test(
    'no-unknown-object-properties',
    ({ path }) => `${path} contains unknown properties`,
    async (value: any, context) => {
      if (context.options.context?.noUnknownPathPrefixes?.some((prefix: string) => context.path.startsWith(prefix))) {
        const availableKeys = new Set(Object.keys(context.schema.fields));
        const unknownKeys = Object.keys(value ?? {}).filter(key => !availableKeys.has(key));
        if (unknownKeys.length > 0) {
          // TODO "did you mean XYZ"
          return context.createError({
            message: `${context.path} contains unknown properties: ${unknownKeys.join(', ')}`,
            path: context.path,
            params: { unknownKeys },
          });
        }
      }
      return true;
    },
  );
  
  // we don't want to update the type of `object` to have a default flag
  return object.default(undefined) as any as typeof object;
}
/* eslint-enable no-restricted-syntax */

// Common
export const adaptSchema = yupMixed<StackAdaptSentinel>();
/**
 * Yup's URL schema does not recognize some URLs (including `http://localhost`) as a valid URL. This schema is a workaround for that.
 */
export const urlSchema = yupString().test({
  name: 'url',
  message: 'Invalid URL',
  test: (value) => {
    if (value === undefined) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
});
export const jsonSchema = yupMixed().nullable().defined().transform((value) => JSON.parse(JSON.stringify(value)));
export const jsonStringSchema = yupString().test("json", "Invalid JSON format", (value) => {
  if (value == null) return true;
  try {
    JSON.parse(value);
    return true;
  } catch (error) {
    return false;
  }
});

// Request auth
export const clientOrHigherAuthTypeSchema = yupString().oneOf(['client', 'server', 'admin']);
export const serverOrHigherAuthTypeSchema = yupString().oneOf(['server', 'admin']);
export const adminAuthTypeSchema = yupString().oneOf(['admin']);

// Projects
export const projectIdSchema = yupString().meta({ openapiField: { description: 'Project ID as retrieved on Stack\'s dashboard', exampleValue: 'project-id' } });

// Users
export const userIdRequestSchema = yupString().uuid().meta({ openapiField: { description: 'The ID of the user', exampleValue: '3241a285-8329-4d69-8f3d-316e08cf140c' } });
export class ReplaceFieldWithOwnUserId extends Error {
  constructor(public readonly path: string) {
    super(`This error should be caught by whoever validated the schema, and the field in the path '${path}' should be replaced with the current user's id. This is a workaround to yup not providing access to the context inside the transform function.`);
  }
}
const userIdMeSentinelUuid = "cad564fd-f81b-43f4-b390-98abf3fcc17e";
export const userIdOrMeRequestSchema = yupString().uuid().transform(v => {
  if (v === "me") return userIdMeSentinelUuid;
  else return v;
}).test((v, context) => {
  if (v === userIdMeSentinelUuid) throw new ReplaceFieldWithOwnUserId(context.path);
  return true;
}).meta({ openapiField: { description: 'The ID of the user, or the special value `me` to signify the currently authenticated user', exampleValue: '3241a285-8329-4d69-8f3d-316e08cf140c' } });
export const userIdResponseSchema = yupString().uuid().meta({ openapiField: { description: 'The immutable user ID used to uniquely identify this user', exampleValue: '3241a285-8329-4d69-8f3d-316e08cf140c' } });
export const primaryEmailSchema = yupString().email().meta({ openapiField: { description: 'Primary email', exampleValue: 'johndoe@example.com' } });
export const primaryEmailVerifiedSchema = yupBoolean().meta({ openapiField: { description: 'Whether the primary email has been verified to belong to this user', exampleValue: true } });
export const userDisplayNameSchema = yupString().nullable().meta({ openapiField: { description: 'Human-readable display name', exampleValue: 'John Doe' } });
export const selectedTeamIdSchema = yupString().meta({ openapiField: { description: 'ID of the team currently selected by the user', exampleValue: 'team-id' } });
export const profileImageUrlSchema = yupString().meta({ openapiField: { description: 'Profile image URL', exampleValue: 'https://example.com/image.jpg' } });
export const signedUpAtMillisSchema = yupNumber().meta({ openapiField: { description: 'Signed up at milliseconds', exampleValue: 1630000000000 } });
export const userClientMetadataSchema = jsonSchema.meta({ openapiField: { description: 'Client metadata. Used as a data store, accessible from the client side', exampleValue: { key: 'value' } } });
export const userServerMetadataSchema = jsonSchema.meta({ openapiField: { description: 'Server metadata. Used as a data store, only accessible from the server side', exampleValue: { key: 'value' } } });

// Auth
export const signInEmailSchema = yupString().email().meta({ openapiField: { description: 'The email to sign in with.', exampleValue: 'johndoe@example.com' } });
export const emailOtpSignInCallbackUrlSchema = urlSchema.meta({ openapiField: { description: 'The base callback URL to construct the magic link from. A query argument `code` with the verification code will be appended to it. The page should then make a request to the `/auth/otp/sign-in` endpoint.', exampleValue: 'https://example.com/handler/magic-link-callback' } });
export const emailVerificationCallbackUrlSchema = urlSchema.meta({ openapiField: { description: 'The base callback URL to construct a verification link for the verification e-mail. A query argument `code` with the verification code will be appended to it. The page should then make a request to the `/contact-channels/verify` endpoint.', exampleValue: 'https://example.com/handler/email-verification' } });
export const accessTokenResponseSchema = yupString().meta({ openapiField: { description: 'Short-lived access token that can be used to authenticate the user', exampleValue: 'eyJhmMiJBMTO...diI4QT' } });
export const refreshTokenResponseSchema = yupString().meta({ openapiField: { description: 'Long-lived refresh token that can be used to obtain a new access token', exampleValue: 'i8nsoaq2...14y' } });
export const signInResponseSchema = yupObject({
  refresh_token: refreshTokenResponseSchema.required(),
  access_token: accessTokenResponseSchema.required(),
  is_new_user: yupBoolean().meta({ openapiField: { description: 'Whether the user is a new user', exampleValue: true } }).required(),
  user_id: userIdResponseSchema.required(),
});