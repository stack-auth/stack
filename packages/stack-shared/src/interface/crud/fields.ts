import * as yup from "yup";
import { yupJson } from "../../utils/yup";

export const projectIdSchema = yup.string().meta({ openapi: { description: 'Stack dashboard project ID', exampleValue: 'project-id' } });
export const userIdSchema = yup.string().meta({ openapi: { description: 'Unique user identifier', exampleValue: 'user-id' } });
export const primaryEmailSchema = yup.string().meta({ openapi: { description: 'Primary email', exampleValue: 'johndoe@example.com' } });
export const primaryEmailVerifiedSchema = yup.boolean().meta({ openapi: { description: 'Whether the primary email has been verified to belong to this user', exampleValue: true } });
export const userDisplayNameSchema = yup.string().meta({ openapi: { description: 'Human-readable display name', exampleValue: 'John Doe' } });
export const selectedTeamIdSchema = yup.string().meta({ openapi: { description: 'ID of the team currently selected by the user', exampleValue: 'team-id' } });
export const profileImageUrlSchema = yup.string().meta({ openapi: { description: 'Profile image URL', exampleValue: 'https://example.com/image.jpg' } });
export const signedUpAtMillisSchema = yup.number().meta({ openapi: { description: 'Signed up at milliseconds', exampleValue: 1630000000000 } });
export const userClientMetadataSchema = yupJson.meta({ openapi: { description: 'Client metadata. Used as a data store, accessible from the client side', exampleValue: { key: 'value' } } });
export const userServerMetadataSchema = yupJson.meta({ openapi: { description: 'Server metadata. Used as a data store, only accessible from the server side', exampleValue: { key: 'value' } } });
