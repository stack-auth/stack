# Stack Auth Proxy

Stack Auth Proxy is a simple one-command proxy that authenticates your HTTP requests and redirects to a pre-built sign-in page if a user is not authenticated.

## Setup

First, create your API keys on the [Stack Auth Dashboard](https://app.stack-auth.com) and retrieve your environment variables. Note that Stack Auth is open-source and can be self-hosted; more details are available [here](https://github.com/stack-auth/stack).

```sh
STACK_PROJECT_ID=<your-project-id> && \
STACK_PUBLISHABLE_CLIENT_KEY=<your-client-key> && \
STACK_SECRET_SERVER_KEY=<your-server-key> && \
npx @stackframe/stack-proxy \
  --server-port <port-to-your-http-server> \
  --proxy-port <port-you-want-to-access-your-website-with>
```

You can also use a glob-style pattern with `--protected-pattern` to specify which routes to protect. By default, all routes are protected.

<details>
  <summary>If you don't have a website, you can run our example server to play around with the proxy</summary>

Start the example server on port 3000:
```sh
git clone https://github.com/stack-auth/stack
cd examples/express-proxied-server
npm install
PORT=3000 && node server.js
```

Now, open a new terminal and run the proxy server on port 3001:

```sh
STACK_PROJECT_ID=<your-project-id> && \
STACK_PUBLISHABLE_CLIENT_KEY=<your-client-key> && \
STACK_SECRET_SERVER_KEY=<your-server-key> && \
npx stack-auth-proxy \
  --server-port 3000 \
  --proxy-port 3001 \
  --protected-pattern "/protected**"
```

You can explore the proxy at [localhost:3001](http://localhost:3001).
</details>

## What You Get

If you access a protected page through the proxy without being authenticated, you will be redirected to a customizable sign-in page like this:

<div align="center">
<img alt="Stack Setup" src="assets/sign-in.png" width="400" />
</div>

After signing in, you will be able to access the protected pages. To retrieve user information from your static website, you can read the headers as shown in this JavaScript (Express) example:

```js
app.get('/', (req, res) => {
  const authenticated = req.headers['x-stack-authenticated'];
  const displayName = req.headers['x-stack-user-display-name'];
  res.send(`
    <div>
      <p>Authenticated: ${authenticated ? "Yes" : "No"}</p>
      ${authenticated ? `<p>Display Name: ${displayName}</p>` : ""}
      ${authenticated ? `<p><a href="/handler/account-settings">Account Settings<\/a><\/p>` : `<p><a href="/handler/sign-in">Sign In<\/a><\/p>`}
    </div>
  `);
});
```

Available headers:

- `x-stack-authenticated`: "true" if authenticated; not present otherwise.
- `x-stack-user-id`
- `x-stack-user-primary-email`
- `x-stack-user-display-name`
- `x-stack-user-profile-image-url`

Available URLs (redirect your app server to these URLs as needed):

- `/handler/sign-in`
- `/handler/sign-up`
- `/handler/sign-out`: Clears cookies and redirects back to your homepage.
- `/handler/account-settings`: Users can update their email, display name, password, etc.

## How It Works

When a request is received, the logic is as follows:

```
if url is /handler/*:
  render the auth pages
else:
  if user is not authenticated && url is protected:
    redirect to /handler/sign-in
  else:
    forward the request to your server with user info headers
```

```mermaid
graph TB
    Client((Request))
    Proxy[Stack Auth Proxy]
    YourServer[Your Server]
    StackAuthServer[Stack Auth Server]
    
    Client --> Proxy
    Proxy --> |"add user info headers"| YourServer
    Proxy --> StackAuthServer
    StackAuthServer --> Proxy

    classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff
    class StackAuthServer container
    class YourServer container
    class Proxy container
```

This diagram illustrates the request flow and interactions between the client, the proxy, your server, and the Stack Auth server.