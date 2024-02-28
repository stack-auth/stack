const crypto = require("crypto");
const jose = require("jose");

console.log("Your generated key is:", jose.base64url.encode(crypto.randomBytes(32)));
