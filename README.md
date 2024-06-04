![Stack Logo](/assets/logo.png)

<h3 align="center">
    <a href="https://docs.stack-auth.com">📘 Documentation</a>
    | <a href="https://stack-auth.com/">☁️ Hosted Version</a>
    | <a href="https://demo.stack-auth.com/">✨ Demo</a>
    | <a href="https://discord.gg/pD4nyYyKrb">Discord</a>
</h4>

## 💬 What is Stack?

Stack is an open-source, self-hostable, and highly customizable authentication and user management system.

We provide frontend and backend libraries for Next.js, React, and JavaScript. You can set it up in one minute and scale with the project as it grows.

Here are some of the components you get out-of-the-box:

![Stack Sign Up Page](/assets/components.png)

Here is the user/project management dashboard:

![Stack Dashboard](/assets/dashboard.png)

## ✨ Features

- Composable React components & hooks
- OAuth (Google, Facebook, GitHub, etc.)
- Magic link and email password authentication (with email verification and password reset)
- Easy to set up with proxied providers (no need to sign up and create OAuth endpoints yourself on all the providers)
- User management & analytics
- Teams & permissions
- User-associated metadata with client-/server-specific permissions
- Out-of-the-box dark/light mode support
- Fully customizable UI, or build your own UI with our functions like `signInWithOAuth`
- **100% open-source!**

## 🔭 Vision

We all know how much overhead there is when starting a new project. Developers need to handle so many things that aren't even part of their core business, like user authentication, user profiles, payments, dashboards, hosting, and more. Our vision is to build a full-stack framework that handles all of this out-of-the-box with less than 10 minutes of setup, so developers can focus on what they really want to build. Authentication is the first step towards this vision.

## 🗺️ Roadmap

- [x] Customizable frontend [20. April 2024]
- [x] Teams [8. May 2024]
- [x] Permissions [10. May 2024]
- [x] New dashboard with Shadcn UI [16. May 2024]
- [x] Email template editor [28. May 2024] 
- [ ] User analytics (retention, DAU/MAU, user segments, etc.)
- [ ] Feature-rich email/notification system
- [ ] Vue.js, Htmx, and Svelte support
- [ ] Python, golang, and Java backend library
- [ ] SSO/SAML integration

## 📦 Installation & Setup

To get started with Stack, you need to [create a Next.js project](https://nextjs.org/docs/getting-started/installation) using the App router. Then, you can install Stack by running the following command:

```bash
npx @stackframe/init-stack@latest
```

You will then be guided through the installation process.

For further configuration and usage, refer to [our documentation](https://docs.stack-auth.com).

## 🏗️ Development & Contribution

This is for you if you want to contribute to the Stack project.

### Requirements

- Node v20
- pnpm v9
- Docker

### Setup

Pre-populated .env files for the setup below are available and used by default in `.env.development` in each of the packages, but you can choose to create your own `.env.local` files instead.

In a terminal, start the dependencies (Postgres and Inbucket) as Docker containers:

```sh
docker compose -f dependencies.compose.yaml up
```

Then:

```sh
pnpm install

# Run code generation (repeat this after eg. changing the Prisma schema)
pnpm run codegen

# Push the most recent Prisma schema to the database
pnpm run prisma:server migrate reset

# Start the dev server
pnpm run dev
```

Your IDE may show an error on all `@stackframe/XYZ` imports. To fix this, simply restart the TypeScript language server; for example, in VSCode you can open the command palette (Ctrl+Shift+P) and run `Developer: Reload Window` or `TypeScript: Restart TS server`.

You can also open Prisma Studio to see the database interface and edit data directly:

```sh
pnpm run prisma:server studio
```

### Database migrations

If you make changes to the Prisma schema, you need to run the following command to create a migration:

```sh
pnpm run prisma:server migrate dev
```
