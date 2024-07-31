import { stackServerApp } from "src/stack";

export default async function Page() {
  const user = await stackServerApp.getUser({ or: 'redirect'});
  const connection = await user.getConnectedAccount('spotify', { or: 'redirect' });
  const tokens = await connection.getAccessToken();

  const response = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  const data = await response.json();
  return JSON.stringify(data);
}
