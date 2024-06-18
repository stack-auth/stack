import crypto from "crypto";
import * as jose from "jose";

console.log("Your generated key is:", jose.base64url.encode(crypto.randomBytes(32)));
