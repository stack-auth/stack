const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
  const authenticated = !!req.headers['x-stack-authenticated'];
  const displayName = req.headers['x-stack-user-display-name'] || '';
  res.send(`
    <div>
      <p>Main page</p>
      <p>Authenticated: ${authenticated ? "Yes" : "No"}</p>
      ${authenticated ? `<p>Display Name: ${displayName}</p>` : ""}
      ${authenticated ? `<p><a href="/handler/account-settings" style="text-decoration: underline;">Account Settings</a></p>` : ""}
      <p><a href="/protected" style="text-decoration: underline;">Go to protected page</a></p>
      ${!authenticated ? '<p><a href="/handler/sign-in" style="text-decoration: underline;">Sign In</a></p>' : ""}
      ${authenticated ? '<p><a href="/handler/sign-out" style="text-decoration: underline;">Sign Out</a></p>' : ""}
    </div>
  `);
});

app.get('/protected', (req, res) => {
  res.send("<p>This is a protected page, only authenticated users can access it</p>");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
