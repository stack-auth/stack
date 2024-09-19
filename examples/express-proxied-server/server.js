const express = require("express");
const handlebars = require("handlebars");

const app = express();
const PORT = process.env.PORT || 3000;

const authenticatedTemplateSource = `
<div>
  <p>Authenticated: Yes</p>
  <p>Display Name: {{displayName}}</p>
  <p><a href="/handler/account-settings" style="text-decoration: underline;">Account Settings</a></p>
  <p><a href="/protected" style="text-decoration: underline;">Go to protected page</a></p>
  <p><a href="/handler/sign-out" style="text-decoration: underline;">Sign Out</a></p>
</div>
`;

const unauthenticatedTemplateSource = `
<div>
  <p>Authenticated: No</p>
  <p><a href="/protected" style="text-decoration: underline;">Go to protected page</a></p>
  <p><a href="/handler/sign-in" style="text-decoration: underline;">Sign In</a></p>
</div>
`;

const authenticatedTemplate = handlebars.compile(authenticatedTemplateSource);
const unauthenticatedTemplate = handlebars.compile(
  unauthenticatedTemplateSource
);

app.get("/", (req, res) => {
  const authenticated = !!req.headers["x-stack-authenticated"];
  const displayName = req.headers["x-stack-user-display-name"] || "";

  let html;
  if (authenticated) {
    html = authenticatedTemplate({ displayName });
  } else {
    html = unauthenticatedTemplate();
  }

  res.send(html);
});

app.get("/protected", (req, res) => {
  const protectedTemplate = handlebars.compile(
    "<p>This is a protected page, only authenticated users can access it</p>"
  );
  res.send(protectedTemplate());
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
