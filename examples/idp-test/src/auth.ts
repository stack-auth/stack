import NextAuth from "next-auth"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [{
    id: "stack-auth", // signIn("my-provider") and will be part of the callback URL
    name: "Stack auth", // optional, used on the default login page as the button text.
    type: "oidc", // or "oauth" for OAuth 2 providers
    issuer: "http://localhost:8103", // to infer the .well-known/openid-configuration URL
    clientId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID, // from the provider's dashboard
    clientSecret: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY, // from the provider's dashboard
  }],
})
