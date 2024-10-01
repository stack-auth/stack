![Stack Logo](/.github/assets/logo.png)

<h3 align="center">
  <a href="https://docs.stack-auth.com">📘 Docs</a>
  | <a href="https://stack-auth.com/">☁️ Hosted Version</a>
  | <a href="https://demo.stack-auth.com/">✨ Demo</a>
  | <a href="https://discord.stack-auth.com">🎮 Discord</a>
</h4>

# Stack Auth: Open-source Clerk/Auth0 alternative

Stack Auth is a managed user authentication solution. It is developer-friendly and fully open-source (licensed under MIT and AGPL).

Stack gets you started in just five minutes, after which you'll be ready to use all of its features as you grow your project. Our managed service is completely optional and you can export your user data and self-host, for free, at any time.

We support Next.js frontends, along with any backend that can use our [REST API](https://docs.stack-auth.com/rest-api/auth). Check out our [setup guide](https://docs.stack-auth.com/getting-started/setup) to get started.

<div align="center">
<img alt="Stack Setup" src=".github/assets/create-project.gif" width="400" />
</div>

## Table of contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [How is this different from X?](#how-is-this-different-from-x)
- [✨ Features](#-features)
- [📦 Installation & Setup](#-installation--setup)
- [🌱 Some community projects built with Stack](#-some-community-projects-built-with-stack)
  - [Templates](#templates)
  - [Examples](#examples)
- [🏗 Development & Contribution](#-development--contribution)
  - [Requirements](#requirements)
  - [Setup](#setup)
  - [Database migrations](#database-migrations)
  - [Chat with the codebase](#chat-with-the-codebase)
  - [Architecture overview](#architecture-overview)
- [❤ Contributors](#-contributors)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## How is this different from X?

Ask yourself about `X`:

- Is `X` open-source?
- Is `X` developer-friendly, well-documented, and lets you get started in minutes?
- Besides authentication, does `X` also do authorization and user management (see feature list below)?

If you answered "no" to any of these questions, then that's how Stack Auth is different from `X`.

## ✨ Features

| | |
|-|:-:|
| <h3>`<SignIn/>` and `<SignUp/>`</h3> Authentication components that support OAuth, password credentials, and magic links, with shared development keys to make setup faster. All components support dark/light modes. | <img alt="Sign-in component" src=".github/assets/dark-light-mode.png" width="250px"> |
| <h3>Idiomatic Next.js APIs</h3> We build on server components, React hooks, and route handlers. | ![Dark/light mode](.github/assets/components.png) |
| <h3>User dashboard</h3> Dashboard to filter, analyze, and edit users. Replaces the first internal tool you would have to build. | ![User dashboard](.github/assets/dashboard.png) |
| <h3>Account settings</h3> Lets users update their profile, verify their e-mail, or change their password. No setup required. | <img alt="Account settings component" src=".github/assets/account-settings.png" width="300px"> |
| <h3>Multi-tenancy & teams</h3> Manage B2B customers with an organization structure that makes sense and scales to millions. | <img alt="Selected team switcher component" src=".github/assets/team-switcher.png" width="400px"> |
| <h3>Role-based access control</h3> Define an arbitrary permission graph and assign it to users. Organizations can create org-specific roles. | <img alt="RBAC" src=".github/assets/permissions.png"  width="400px"> |
| <h3>OAuth Connections</h3>Beyond login, Stack can also manage access tokens for third-party APIs, such as Outlook and Google Calendar. It handles refreshing tokens and controlling scope, making access tokens accessible via a single function call. | <img alt="OAuth tokens" src=".github/assets/connected-accounts.png"  width="250px"> |
| <h3>Impersonation</h3> Impersonate users for debugging and support, logging into their account as if you were them. | <img alt="Webhooks" src=".github/assets/impersonate.png"  width="350px"> |
| <h3>Webhooks</h3> Get notified when users use your product, built on Svix. | <img alt="Webhooks" src=".github/assets/stack-webhooks.png"  width="300px"> |
| <h3>Automatic emails</h3> Send customizable emails on triggers such as sign-up, password reset, and email verification, editable with a WYSIWYG editor. | <img alt="Email templates" src=".github/assets/email-editor.png"  width="400px"> |
| <h3>User session & JWT handling</h3> Stack manages refresh and access tokens, JWTs, and cookies, resulting in the best performance at no implementation cost. | <img alt="User button" src=".github/assets/user-button.png"  width="400px"> |
| <h3>M2M authentication</h3> Use short-lived access tokens to authenticate your machines to other machines. | <img src=".github/assets/m2m-auth.png" alt="M2M authentication"  width="400px"> |


## 📦 Installation & Setup

Refer to [our documentation](https://docs.stack-auth.com/getting-started/setup) on how to set up Stack Auth in your Next.js project.

## 🌱 Some community projects built with Stack

Have your own? Happy to feature it if you create a PR or message us on [Discord](https://discord.stack-auth.com).

### Templates
- [Stack Template by Stack Team](https://github.com/stack-auth/stack-template)
- [Next SaaSkit by wolfgunblood](https://github.com/wolfgunblood/nextjs-saaskit)

### Examples
- [Stack Example by career-tokens](https://github.com/career-tokens/StackYCAuth)
- [Stack Demo by the Stack team](https://github.com/stack-auth/stack/tree/dev/examples/demo)
- [Stack E-Commerce Example by the Stack team](https://github.com/stack-auth/stack/tree/dev/examples/e-commerce)

## 🏗 Development & Contribution

This is for you if you want to contribute to the Stack project or run the Stack dashboard locally.

**Important**: Please read the [contribution guidelines](CONTRIBUTING.md) carefully and join [our Discord](https://discord.stack-auth.com) if you'd like to help.

### Requirements

- Node v20
- pnpm v9
- Docker

### Setup

Pre-populated .env files for the setup below are available and used by default in `.env.development` in each of the packages. You should copy all the `.env.development` files to `.env.local` in the respective packages for local development.

In a new terminal:

```sh
pnpm install

# Run build to build everything once
pnpm run build

# reset & start the dependencies (DB, Inbucket, etc.) as Docker containers, seeding the DB with the Prisma schema
pnpm run start-deps
# pnpm run restart-deps
# pnpm run stop-deps

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

### Chat with the codebase

Storia trained an [AI on our codebase](https://sage.storia.ai/stack-auth) that can answer questions about using and contributing to Stack.

### Architecture overview

```mermaid
  graph TB
      User((User))
      Admin((Admin))
      subgraph "Stack Auth System"
          Dashboard[Dashboard<br/>Next.js Application]
          Backend[Backend Service<br/>Next.js API]
          Database[(PostgreSQL Database)]
          EmailService[Email Service<br/>Inbucket]
          WebhookService[Webhook Service<br/>Svix]
          subgraph "Shared Packages"
              StackUI[Stack UI<br/>React Components]
              StackShared[Stack Shared<br/>Utilities]
              StackEmails[Stack Emails<br/>Email Templates]
          end
      end
      ExternalOAuth[External OAuth Providers]
      User --> Dashboard
      Admin --> Dashboard
      Dashboard --> Backend
      Dashboard -.-> |"(To be removed)"| Database
      Dashboard -.-> |"(To be removed)"| EmailService
      Backend --> Database
      Backend --> EmailService
      Backend --> WebhookService
      Backend --> ExternalOAuth
      Dashboard --> StackUI
      Dashboard --> StackShared
      Dashboard --> StackEmails
      Backend --> StackShared
      Backend --> StackEmails
      subgraph "External Services"
          Svix[Svix]
          WebhookService --> Svix
      end
      classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff
      classDef database fill:#2b78e4,stroke:#1a4d91,color:#ffffff
      classDef external fill:#999999,stroke:#666666,color:#ffffff
      classDef deprecated stroke-dasharray: 5 5
      class Dashboard,Backend,EmailService,WebhookService container
      class Database database
      class ExternalOAuth,Svix external
```

Thanks to [CodeViz](https://www.codeviz.ai) for generating the diagram!

## ❤ Contributors

<a href="https://github.com/stack-auth/stack/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=stack-auth/stack&columns=9" width="100%" />
</a>
