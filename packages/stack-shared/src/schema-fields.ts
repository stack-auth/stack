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
export const projectIdSchema = yup.string().meta({ openapi: { description: 'Project ID as retrieved on Stack\'s dashboard', exampleValue: 'project-id' } });

// Users
export const userIdSchema = yup.string().meta({ openapi: { description: 'Unique user identifier', exampleValue: 'user-id' } });
export const primaryEmailSchema = yup.string().email().meta({ openapi: { description: 'Primary email', exampleValue: 'johndoe@example.com' } });
export const primaryEmailVerifiedSchema = yup.boolean().meta({ openapi: { description: 'Whether the primary email has been verified to belong to this user', exampleValue: true } });
export const userDisplayNameSchema = yup.string().meta({ openapi: { description: 'Human-readable display name', exampleValue: 'John Doe' } });
export const selectedTeamIdSchema = yup.string().meta({ openapi: { description: 'ID of the team currently selected by the user', exampleValue: 'team-id' } });
export const profileImageUrlSchema = yup.string().meta({ openapi: { description: 'Profile image URL', exampleValue: 'https://example.com/image.jpg' } });
export const signedUpAtMillisSchema = yup.number().meta({ openapi: { description: 'Signed up at milliseconds', exampleValue: 1630000000000 } });
export const userClientMetadataSchema = yupJson.meta({ openapi: { description: 'Client metadata. Used as a data store, accessible from the client side', exampleValue: { key: 'value' } } });
export const userServerMetadataSchema = yupJson.meta({ openapi: { description: 'Server metadata. Used as a data store, only accessible from the server side', exampleValue: { key: 'value' } } });

// Auth
export const signInEmailSchema = yup.string().email().meta({ openapi: { description: 'The email to sign in with.', exampleValue: 'johndoe@example.com' } });
export const verificationLinkRedirectUrlSchema = urlSchema.meta({ openapi: { description: 'The URL to redirect to after the user has verified their email. A query argument `code` with the verification code will be appended to it.', exampleValue: 'https://example.com/handler' } });
export const accessTokenResponseSchema = yup.string().meta({ openapi: { description: 'Short-lived access token that can be used to authenticate the user', exampleValue: 'eyJhmMiJBMTO...diI4QT' } });
export const refreshTokenResponseSchema = yup.string().meta({ openapi: { description: 'Long-lived refresh token that can be used to obtain a new access token', exampleValue: 'i8nsoaq2...14y' } });
