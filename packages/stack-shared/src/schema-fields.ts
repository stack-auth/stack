import * as yup from "yup";
import { yupJson } from "./utils/yup";

declare const StackAdaptSentinel: unique symbol;
export type StackAdaptSentinel = typeof StackAdaptSentinel;

// Common
export const adaptSchema = yup.mixed<StackAdaptSentinel>();
/**
 * Yup's URL schema does not recognize some URLs (including `http://localhost`) as a valid URL. This schema is a workaround for that.
 */
export const urlSchema = yup.string().test({
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


// Request auth
export const clientOrHigherAuthTypeSchema = yup.string().oneOf(['client', 'server', 'admin']);
export const serverOrHigherAuthTypeSchema = yup.string().oneOf(['server', 'admin']);
export const adminAuthTypeSchema = yup.string().oneOf(['admin']);

// Projects
export const projectIdSchema = yup.string().meta({ openapiField: { description: 'Project ID as retrieved on Stack\'s dashboard', exampleValue: 'project-id' } });

// Users
export const userIdRequestSchema = yup.string().uuid().meta({ openapiField: { description: 'The ID of the user', exampleValue: '3241a285-8329-4d69-8f3d-316e08cf140c' } });
export class ReplaceFieldWithOwnUserId extends Error {
  constructor(public readonly path: string) {
    super(`This error should be caught by whoever validated the schema, and the field in the path '${path}' should be replaced with the current user's id. This is a workaround to yup not providing access to the context inside the transform function.`);
  }
}
const userIdMeSentinelUuid = "cad564fd-f81b-43f4-b390-98abf3fcc17e";
export const userIdOrMeRequestSchema = yup.string().uuid().transform(v => {
  if (v === "me") return userIdMeSentinelUuid;
  else return v;
}).test((v, context) => {
  if (v === userIdMeSentinelUuid) throw new ReplaceFieldWithOwnUserId(context.path);
  return true;
}).meta({ openapiField: { description: 'The ID of the user, or the special value `me` to signify the currently authenticated user', exampleValue: '3241a285-8329-4d69-8f3d-316e08cf140c' } });
export const userIdResponseSchema = yup.string().uuid().meta({ openapiField: { description: 'The immutable user ID used to uniquely identify this user', exampleValue: '3241a285-8329-4d69-8f3d-316e08cf140c' } });
export const primaryEmailSchema = yup.string().email().meta({ openapiField: { description: 'Primary email', exampleValue: 'johndoe@example.com' } });
export const primaryEmailVerifiedSchema = yup.boolean().meta({ openapiField: { description: 'Whether the primary email has been verified to belong to this user', exampleValue: true } });
export const userDisplayNameSchema = yup.string().nullable().meta({ openapiField: { description: 'Human-readable display name', exampleValue: 'John Doe' } });
export const selectedTeamIdSchema = yup.string().meta({ openapiField: { description: 'ID of the team currently selected by the user', exampleValue: 'team-id' } });
export const profileImageUrlSchema = yup.string().meta({ openapiField: { description: 'Profile image URL', exampleValue: 'https://example.com/image.jpg' } });
export const signedUpAtMillisSchema = yup.number().meta({ openapiField: { description: 'Signed up at milliseconds', exampleValue: 1630000000000 } });
export const userClientMetadataSchema = yupJson.meta({ openapiField: { description: 'Client metadata. Used as a data store, accessible from the client side', exampleValue: { key: 'value' } } });
export const userServerMetadataSchema = yupJson.meta({ openapiField: { description: 'Server metadata. Used as a data store, only accessible from the server side', exampleValue: { key: 'value' } } });

// Auth
export const signInEmailSchema = yup.string().email().meta({ openapiField: { description: 'The email to sign in with.', exampleValue: 'johndoe@example.com' } });
export const emailOtpSignInCallbackUrlSchema = urlSchema.meta({ openapiField: { description: 'The base callback URL to construct the magic link from. A query argument `code` with the verification code will be appended to it. The page should then make a request to the `/auth/otp/sign-in` endpoint.', exampleValue: 'https://example.com/handler/magic-link-callback' } });
export const emailVerificationCallbackUrlSchema = urlSchema.meta({ openapiField: { description: 'The base callback URL to construct a verification link for the verification e-mail. A query argument `code` with the verification code will be appended to it. The page should then make a request to the `/contact-channels/verify` endpoint.', exampleValue: 'https://example.com/handler/email-verification' } });
export const accessTokenResponseSchema = yup.string().meta({ openapiField: { description: 'Short-lived access token that can be used to authenticate the user', exampleValue: 'eyJhmMiJBMTO...diI4QT' } });
export const refreshTokenResponseSchema = yup.string().meta({ openapiField: { description: 'Long-lived refresh token that can be used to obtain a new access token', exampleValue: 'i8nsoaq2...14y' } });
export const signInResponseSchema = yup.object({
  refresh_token: refreshTokenResponseSchema.required(),
  access_token: accessTokenResponseSchema.required(),
  is_new_user: yup.boolean().meta({ openapiField: { description: 'Whether the user is a new user', exampleValue: true } }).required(),
  user_id: userIdResponseSchema.required(),
});
