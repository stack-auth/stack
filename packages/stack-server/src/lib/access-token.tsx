import * as yup from 'yup';
import { JWTExpired } from 'jose/errors';
import { AccessTokenExpiredErrorCode, KnownError } from 'stack-shared/dist/utils/types';
import { decryptJWT, encryptJWT } from 'stack-shared/dist/utils/jwt';
import { StatusError } from 'stack-shared/dist/utils/errors';

export const authorizationHeaderSchema = yup.string().matches(/^StackSession [^ ]+$/);

const accessTokenSchema = yup.object({
  projectId: yup.string().required(),
  userId: yup.string().required(),
  exp: yup.number().required(),
});

export async function decodeAccessToken(accessToken: string) {
  let decoded;
  try {
    decoded = await decryptJWT(accessToken);
  } catch (error) {
    if (error instanceof JWTExpired) {
      throw new KnownError(AccessTokenExpiredErrorCode);
    }
    throw error;
  }

  return await accessTokenSchema.validate(decoded);
}

export async function encodeAccessToken({
  projectId,
  userId,
}: {
  projectId: string,
  userId: string,
}) {
  return await encryptJWT({ projectId, userId }, process.env.STACK_ACCESS_TOKEN_EXPIRATION_TIME || '1h');
}
