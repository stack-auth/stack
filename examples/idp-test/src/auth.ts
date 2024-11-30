import NextAuth from "next-auth"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [{
    id: "stack-auth", // signIn("my-provider") and will be part of the callback URL
    name: "Stack auth", // optional, used on the default login page as the button text.
    type: "oidc", // or "oauth" for OAuth 2 providers
    issuer: "http://localhost:8102/api/v1/integrations/neon/oauth", // to infer the .well-known/openid-configuration URL
    clientId: "client-id", // from the provider's dashboard
    
    checks: ["pkce"],
    clientSecret: "test-client-secret", // from the provider's dashboard
  }],
})
