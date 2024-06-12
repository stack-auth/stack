import * as yup from "yup";
import { yupJson } from "../../utils/yup";

export const projectIdSchema = yup.string().meta({ description: 'Stack dashboard project ID', example: 'project-id' });
export const userIdSchema = yup.string().meta({ description: 'Unique user identifier', example: 'user-id' });
export const primaryEmailSchema = yup.string().meta({ description: 'Primary email', example: 'johndeo@email.com' });
export const primaryEmailVerifiedSchema = yup.boolean().meta({ description: 'Primary email verified', example: true });
export const userDisplayNameSchema = yup.string().meta({ description: 'User display name', example: 'John Deo' });
export const selectedTeamIdSchema = yup.string().meta({ description: 'Selected team ID', example: 'team-id' });
export const profileImageUrlSchema = yup.string().meta({ description: 'Profile image URL', example: 'https://example.com/image.jpg' });
export const signedUpAtMillisSchema = yup.number().meta({ description: 'Signed up at milliseconds', example: 1630000000000 });
export const userClientMetadataSchema = yupJson.meta({ description: 'Client metadata. Used as a data store, accessible from the client side', example: { key: 'value' } });
export const userServerMetadataSchema = yupJson.meta({ description: 'Server metadata. Used as a data store, only accessible from the server side', example: { key: 'value' } });