
import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    issuer: "http://localhost:8103",
    authorization_endpoint: "http://localhost:8103/handler/auth",
    token_endpoint: "http://localhost:8102/token",
    userinfo_endpoint: "http://localhost:8102/userinfo",
    jwks_uri: "http://localhost:8102/.well-known/jwks.json",
    registration_endpoint: "http://localhost:8102/register",
    scopes_supported: ["openid", "profile", "email", "address", "phone"],
    response_types_supported: ["code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"],
    subject_types_supported: ["public", "pairwise"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
  };

  return NextResponse.json(data);
}
