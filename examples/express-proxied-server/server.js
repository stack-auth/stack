const express = require("express");
const handlebars = require("handlebars");
const crypto = require("crypto");
const session = require("express-session");

const app = express();

// Set up session middleware
app.use(session({
  secret: crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === "production" }
}));

// CSRF protection middleware
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

// CSRF token validation middleware
const validateCSRF = (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    const token = req.headers["x-csrf-token"] || req.body._csrf;
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).send("Invalid CSRF token");
    }
  }
  next();
};

app.use(validateCSRF);
const PORT = process.env.PORT || 3000;

const authenticatedTemplateSource = `
<div>
  <p>Authenticated: Yes</p>
  <p>Display Name: {{displayName}}</p>
  <p><a href="/handler/account-settings" style="text-decoration: underline;">Account Settings</a></p>
  <p><a href="/protected" style="text-decoration: underline;">Go to protected page</a></p>
  <form action="/handler/sign-out" method="POST">
    <input type="hidden" name="_csrf" value="{{csrfToken}}">
    <button type="submit" style="text-decoration: underline;">Sign Out</button>
  </form>
</div>
`;

const unauthenticatedTemplateSource = `
<div>
  <p>Authenticated: No</p>
  <p><a href="/protected" style="text-decoration: underline;">Go to protected page</a></p>
  <form action="/handler/sign-in" method="POST">
    <input type="hidden" name="_csrf" value="{{csrfToken}}">
    <button type="submit" style="text-decoration: underline;">Sign In</button>
  </form>
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
    html = authenticatedTemplate({ displayName, csrfToken: res.locals.csrfToken });
  } else {
    html = unauthenticatedTemplate({ csrfToken: res.locals.csrfToken });
  }

  res.send(html);
});

app.get("/protected", (req, res) => {
  const protectedTemplate = handlebars.compile(
    "<p>This is a protected page, only authenticated users can access it</p>"
  );
  res.send(protectedTemplate({ csrfToken: res.locals.csrfToken }));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
