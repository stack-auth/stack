# Contributing to Stack Auth

Welcome to Stack Auth!

Due to the nature of authentication, this may not be the easiest project to contribute to, so if you are looking for projects to help gain programming experience, we may not be a great match. However, the easiest way to help is by contributing to our documentation and creating examples & guides. This way, you can share your knowledge and expertise with everyone else, and it's a great way to understand Stack Auth from the inside before contributing code changes. It is also a great way for us to assess your skills and understand where you could best help the project.

If you're interested, please join [our Discord](https://discord.stack-auth.com) and get in touch.

# Note: We are not currently hiring.

## First time contributors

If you would like to contribute to the project, you can start by looking at the issues labeled as [good first issue](https://github.com/stack-auth/stack/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22),


## Security & bug bounties

For any security-related concerns & bug bounties, please email us at [security@stack-auth.com](mailto:security@stack-auth.com).


## Before creating a pull request

Please make sure to:

- Install ESLint in your IDE and follow the code format of the code base (e.g., spaces around `=`, semicolons at the end, etc.).
- Run `pnpm typecheck`, `pnpm lint`, and `pnpm build`. `pnpm prisma migrate dev` All of them should pass.
- Create only one DB migration file per PR.
- Ensure all dependencies are in the correct `package.json` files.
- Ensure the PR is ready for review. If you want to discuss WIP code, make it a draft.
