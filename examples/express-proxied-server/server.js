const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// Function to generate a random token
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to set CSRF token
app.use((req, res, next) => {
  if (!req.session) {
    req.session = {};
  }
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

// Middleware to validate CSRF token for POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    if (req.body.csrf_token !== req.session.csrfToken) {
      return res.status(403).send('Invalid CSRF token');
    }
  }
  next();
});


app.get('/', (req, res) => {
  const authenticated = !!req.headers['x-stack-authenticated'];
  const displayName = req.headers['x-stack-user-display-name'] || '';
  res.send(`
    <div>
      <p>Main page</p>
      <p>Authenticated: ${authenticated ? "Yes" : "No"}</p>
      ${authenticated ? `<p>Display Name: ${displayName}</p>` : ""}
      ${authenticated ? `
        <form action="/handler/account-settings" method="POST">
          <input type="hidden" name="csrf_token" value="${res.locals.csrfToken}">
          <button type="submit" style="text-decoration: underline;">Account Settings</button>
        </form>
      ` : ""}
      <p><a href="/protected" style="text-decoration: underline;">Go to protected page</a></p>
      ${!authenticated ? `
        <form action="/handler/sign-in" method="POST">
          <input type="hidden" name="csrf_token" value="${res.locals.csrfToken}">
          <button type="submit" style="text-decoration: underline;">Sign In</button>
        </form>
      ` : ""}
      ${authenticated ? `
        <form action="/handler/sign-out" method="POST">
          <input type="hidden" name="csrf_token" value="${res.locals.csrfToken}">
          <button type="submit" style="text-decoration: underline;">Sign Out</button>
        </form>
      ` : ""}
    </div>
  `);
});

app.get('/protected', (req, res) => {
  res.send("<p>This is a protected page, only authenticated users can access it</p>");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
