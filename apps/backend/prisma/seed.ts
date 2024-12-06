/* eslint-disable no-restricted-syntax */
import { PrismaClient } from '@prisma/client';
import { throwErr } from '@stackframe/stack-shared/dist/utils/errors';
import { hashPassword } from "@stackframe/stack-shared/dist/utils/hashes";

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Optional default admin user
  const adminEmail = process.env.STACK_SEED_USER_EMAIL;
  const adminPassword = process.env.STACK_SEED_USER_PASSWORD;
  const adminInternalAccess = process.env.STACK_SEED_USER_INTERNAL_ACCESS === 'true';
  const adminGithubId = process.env.STACK_SEED_USER_GITHUB_ID;

  // dashboard settings
  const dashboardDomain = process.env.NEXT_PUBLIC_STACK_DASHBOARD_URL;
  const oauthProviderIds = process.env.STACK_SEED_OAUTH_PROVIDERS?.split(',') ?? [];
  const otpEnabled = process.env.STACK_SEED_OTP_ENABLED === 'true';
  const signUpEnabled = process.env.STACK_SEED_SIGN_UP_ENABLED === 'true';
  const allowLocalhost = process.env.STACK_SEED_ALLOW_LOCALHOST === 'true';
  const clientTeamCreation = process.env.STACK_SEED_CLIENT_TEAM_CREATION === 'true';

  let internalProject = await prisma.project.findUnique({
    where: {
      id: 'internal',
    },
    include: {
      config: true,
    }
  });

  if (!internalProject) {
    internalProject = await prisma.project.create({
      data: {
        id: 'internal',
        displayName: 'Stack Dashboard',
        description: 'Stack\'s admin dashboard',
        isProductionMode: false,
        apiKeySets: {
          create: [{
            description: "Internal API key set",
            // These keys must match the values used in the Stack dashboard env to be able to login via the UI.
            publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || throwErr('NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is not set'),
            secretServerKey: process.env.STACK_SECRET_SERVER_KEY || throwErr('STACK_SECRET_SERVER_KEY is not set'),
            superSecretAdminKey: process.env.STACK_SUPER_SECRET_ADMIN_KEY || throwErr('STACK_SUPER_SECRET_ADMIN_KEY is not set'),
            expiresAt: new Date('2099-12-31T23:59:59Z'),
          }],
        },
        config: {
          create: {
            allowLocalhost: true,
            signUpEnabled,
            emailServiceConfig: {
              create: {
                proxiedEmailServiceConfig: {
                  create: {}
                }
              }
            },
            createTeamOnSignUp: false,
            clientTeamCreationEnabled: clientTeamCreation,
            authMethodConfigs: {
              create: [
                {
                  passwordConfig: {
                    create: {},
                  }
                },
                ...(otpEnabled ? [{
                  otpConfig: {
                    create: {
                      contactChannelType: 'EMAIL'
                    },
                  }
                }]: []),
              ],
            },
            oauthProviderConfigs: {
              create: oauthProviderIds.map((id) => ({
                id,
                proxiedOAuthConfig: {
                  create: {
                    type: id.toUpperCase() as any,
                  }
                },
                projectUserOAuthAccounts: {
                  create: []
                }
              })),
            },
          }
        }
      },
      include: {
        config: true,
      }
    });

    await prisma.projectConfig.update({
      where: {
        id: internalProject.configId,
      },
      data: {
        authMethodConfigs: {
          create: [
            ...oauthProviderIds.map((id) => ({
              oauthProviderConfig: {
                connect: {
                  projectConfigId_id: {
                    id,
                    projectConfigId: (internalProject as any).configId,
                  }
                }
              }
            }))
          ],
        },
      }
    });

    console.log('Internal project created');
  }

  // Create optional default admin user if credentials are provided.
  // This user will be able to login to the dashboard with both email/password and magic link.
  if ((adminEmail && adminPassword) || adminGithubId) {
    await prisma.$transaction(async (tx) => {
      const oldAdminUser = await tx.projectUser.findFirst({
        where: {
          projectId: 'internal',
          projectUserId: '33e7c043-d2d1-4187-acd3-f91b5ed64b46'
        }
      });

      if (oldAdminUser) {
        console.log(`User with email ${adminEmail} already exists, skipping creation`);
      } else {
        const newUser = await tx.projectUser.create({
          data: {
            projectUserId: '33e7c043-d2d1-4187-acd3-f91b5ed64b46',
            projectId: 'internal',
            serverMetadata: adminInternalAccess
              ? { managedProjectIds: ['internal'] }
              : undefined,
          }
        });

        if (adminEmail && adminPassword) {
          await tx.contactChannel.create({
            data: {
              projectUserId: newUser.projectUserId,
              projectId: 'internal',
              type: 'EMAIL' as const,
              value: adminEmail as string,
              isVerified: false,
              isPrimary: 'TRUE',
              usedForAuth: 'TRUE',
            }
          });

          const passwordConfig = await tx.passwordAuthMethodConfig.findFirstOrThrow({
            where: {
              projectConfigId: (internalProject as any).configId
            },
            include: {
              authMethodConfig: true,
            }
          });

          await tx.authMethod.create({
            data: {
              projectId: 'internal',
              projectConfigId: (internalProject as any).configId,
              projectUserId: newUser.projectUserId,
              authMethodConfigId: passwordConfig.authMethodConfigId,
              passwordAuthMethod: {
                create: {
                  passwordHash: await hashPassword(adminPassword),
                  projectUserId: newUser.projectUserId,
                }
              }
            }
          });

          console.log(`Added admin user with email ${adminEmail}`);
        }

        if (adminGithubId) {
          const githubConfig = await tx.oAuthProviderConfig.findUnique({
            where: {
              projectConfigId_id: {
                projectConfigId: (internalProject as any).configId,
                id: 'github'
              }
            }
          });

          if (!githubConfig) {
            throw new Error('GitHub OAuth provider config not found');
          }

          await tx.projectUserOAuthAccount.create({
            data: {
              projectId: 'internal',
              projectConfigId: (internalProject as any).configId,
              projectUserId: newUser.projectUserId,
              oauthProviderConfigId: 'github',
              providerAccountId: adminGithubId
            }
          });

          console.log(`Added admin user with GitHub ID ${adminGithubId}`);
        }
      }
    });
  }

  if (internalProject.config.allowLocalhost !== allowLocalhost) {
    console.log('Updating allowLocalhost for internal project: ', allowLocalhost);

    await prisma.project.update({
      where: { id: 'internal' },
      data: {
        config: {
          update: {
            allowLocalhost,
          }
        }
      }
    });
  }

  if (dashboardDomain) {
    const url = new URL(dashboardDomain);

    if (url.hostname !== 'localhost') {
      console.log('Adding trusted domain for internal project: ', dashboardDomain);

      await prisma.projectDomain.upsert({
        where: {
          projectConfigId_domain: {
            projectConfigId: internalProject.configId,
            domain: dashboardDomain,
          }
        },
        update: {},
        create: {
          projectConfigId: internalProject.configId,
          domain: dashboardDomain,
          handlerPath: '/',
        }
      });
    } else if (!allowLocalhost) {
      throw new Error('Cannot use localhost as a trusted domain if STACK_SEED_ALLOW_LOCALHOST is not set to true');
    }
  }

  console.log('Seeding complete!');
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
}).finally(async () => await prisma.$disconnect());
