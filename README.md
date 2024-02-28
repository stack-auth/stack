# Stack

Stack is an open-source, self-hostable, and highly customizable authentication and user management system.

We provide front- and backend libraries for Next.js, React, and JavaScript. You can set it up in one minute and scale with the project as it grows. Think of it as Supabase Auth or `next-auth`, but better.

## Features

- OAuth (Google, Facebook, GitHub, etc.)
- Email and password authentication (with email verification, password reset, etc.)
- Easy to set-up with proxied providers
- User management & analytics
- Pre-built React components & hooks
- Support for static sites & single-page apps
- User-associated metadata with client-/server-specific permissions
- **100% open-source!**

## Getting Started

### Installation

To get started with Stack, you need to [create a Next.js project](https://nextjs.org/docs/getting-started/installation) using the App router. Then, you can install Stack by running the following command:

```bash
### TODO
```

For setup, refer to [our documentation](https://weblit-docs.vercel.app/docs/setup).

## Development setup

This is for you if you want to contribute to the Stack project.

Make sure you have `pnpm` installed alongside Node v20. Next, ensure you created `.env.local` files by copying `.env` in each of the subpackages in the `packages` folder and filling out the variables. You will need to start a Postgres database; you can do this with the following command:

```sh
docker run -it --rm -e POSTGRES_PASSWORD=password -p "5432:5432" postgres
```

Then:

```sh
pnpm install

# Run code generation (repeat this after eg. changing the Prisma schema)
pnpm run codegen

# After starting a Postgres database and filling the corresponding variables in .env.local, push the schema to the database:
pnpm run prisma:server -- db reset

# Start the dev server
pnpm run dev
```

To do linting and typechecking:

```sh
pnpm run codegen
```

You can also open Prisma Studio to see the database interface and edit data directly:

```sh
pnpm run prisma:server -- studio
```
