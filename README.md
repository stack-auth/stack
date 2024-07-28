![Stack Logo](/assets/logo.png)

<h3 align="center">
  <a href="https://docs.stack-auth.com">📘 Documentation</a>
  | <a href="https://stack-auth.com/">☁️ Hosted Version</a>
  | <a href="https://demo.stack-auth.com/">✨ Demo</a>
  | <a href="https://discord.stack-auth.com">🎮 Discord</a>
</h4>

# Stack Auth: Open-source Clerk/Auth0 alternative

Stack Auth is a fully managed solution. It provide frontend and backend libraries for Next.js, React, and JavaScript. The setup is just five minutes, and you will instantly get to use features that you would otherwise need to implement yourself as you grow your project, such as password reset, organizations/teams, impersonation, RBAC, and user metadata.

Get started with OAuth and email/password Auth by just clicking a few toggles:

![Stack Setup](/assets/create-project.gif)

A dashboard for managing user data, teams, auth methods, and permissions:

![Stack Dashboard](/assets/dashboard.png)

## ✨ Features

<!-- - Composable React components & hooks
- OAuth (Google, Facebook, GitHub, etc.)
- Magic link and email password authentication (with email verification and password reset)
- Easy to set up with proxied providers (no need to sign up and create OAuth endpoints yourself on all the providers)
- User management & analytics
- Teams & permissions
- User-associated metadata with client-/server-specific permissions
- Out-of-the-box dark/light mode support
- Fully customizable UI, or build your own UI with our functions like `signInWithOAuth`
- **100% open-source!** -->

| | |
|-|-|
| <h3>`<SignIn/>` and `<SignUp/>` components</h3> Ready to use sign-in and sign up components. Support Github, Google, Microsoft, Facebook, Spotify, email/password, and magic link. All customizable on the dashboard without extra setup. | ![Sign-in component](/assets/sign-in.png) |
| <h3>`<AccountSetting/>` component</h3> Component for update user name, send verification email, and change password. | ![Account settings component](/assets/account-settings.png) |
| <h3>`<UserButton/>` component</h3> Component for user profile, dark/light theme, and navigating to account-setting page, and sign-out. | ![User button component](/assets/user-button.png) |
| <h3>`<SelectedTeamSwitcher/>` component</h3> Component for switching between your teams. | ![Selected team switcher component](/assets/team-switcher.png) |
| <h3>Role-based access control</h3> Define arbitrary permission graph (yes, any graph) and assign to users. Check if a user has permission with `user.hasPermission`. | ![RBAC](/assets/permissions.png) |

## 🔭 Vision

We all know how much overhead there is when starting a new project. Developers need to handle so many things that aren't even part of their core business, like user authentication, user profiles, payments, dashboards, hosting, and more. Our vision is to build a full-stack framework that handles all of this out-of-the-box with less than 10 minutes of setup, so developers can focus on what they really want to build. Authentication is the first step towards this vision.

## 📦 Installation & Setup

To get started with Stack, you need to [create a Next.js project](https://nextjs.org/docs/getting-started/installation) using the App router. Then, you can install Stack by running the following command:

```bash
npx @stackframe/init-stack@latest
```

You will then be guided through the installation process.

For further configuration and usage, refer to [our documentation](https://docs.stack-auth.com).

## 🌱 Some community projects built with Stack

- [Next SaaSkit by wolfgunblood](https://github.com/wolfgunblood/nextjs-saaskit)
- [Stack Example by career-tokens](https://github.com/career-tokens/StackYCAuth)

## 🏗️ Development & Contribution

This is for you if you want to contribute to the Stack project or run the Stack dashboard locally.

Please read the [contribution guidelines](CONTRIBUTING.md) before contributing.

### Requirements

- Node v20
- pnpm v9
- Docker

### Setup

Pre-populated .env files for the setup below are available and used by default in `.env.development` in each of the packages. You should copy all the `.env.development` files to `.env.local` in the respective packages for local development.

In a terminal, start the dependencies (Postgres and Inbucket) as Docker containers:

```sh
docker compose -f dependencies.compose.yaml up
```

Then open a new terminal:

```sh
pnpm install

# Run build to build everything once
pnpm run build

# initialize the database and seed it with some data
pnpm prisma db push
pnpm prisma db seed

# Run code generation (repeat this after eg. changing the Prisma schema). This is part of the build script, but faster
pnpm run codegen

# Start the dev server
pnpm run dev

# In a different terminal, run tests in watch mode
pnpm run test
```

You can now open the dashboard at [http://localhost:8101](http://localhost:8101), API on port 8102, demo on port 8103, docs on port 8104, Inbucket (e-mails) on port 8105, and Prisma Studio on port 8106.

Your IDE may show an error on all `@stackframe/XYZ` imports. To fix this, simply restart the TypeScript language server; for example, in VSCode you can open the command palette (Ctrl+Shift+P) and run `Developer: Reload Window` or `TypeScript: Restart TS server`.

You can also open Prisma Studio to see the database interface and edit data directly:

```sh
pnpm run prisma studio
```

### Database migrations

If you make changes to the Prisma schema, you need to run the following command to create a migration:

```sh
pnpm run prisma migrate dev
```

## Contributors

**Important**: Please read the [contribution guidelines](CONTRIBUTING.md) carefully and join [our Discord](https://discord.stack-auth.com) if you'd also like to help.

Thanks to our amazing community who have helped us build Stack:

<a href="https://github.com/stack-auth/stack/graphs/contributors">
  <img src="https://api.dev.stack-auth.com/api/v1/contributors" />
</a>
