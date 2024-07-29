import { stackServerApp } from "src/stack";

export default async function Page() {
  const user = await stackServerApp.getUser({ or: 'redirect'});
  const connection = await user.getConnectedAccount('spotify', { or: 'redirect' });
  const tokens = await connection.getAccessToken();

  return tokens.accessToken;
}
