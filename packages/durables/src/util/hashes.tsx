import { encodeBase32 } from "@stackframe/stack-shared/dist/utils/bytes";
import { sha512 } from "@stackframe/stack-shared/dist/utils/hashes";


/**
 * Returns a 20 character base32 encoded string that is a hash of the input.
 */
export async function generateHashedCode(uniqueKind: string, str: string): Promise<string> {
  const toHash = JSON.stringify(["--stack-durables-generateHashedCode", uniqueKind, str]);
  const hash = encodeBase32(await sha512(toHash));
  return hash.slice(0, 20);
}
