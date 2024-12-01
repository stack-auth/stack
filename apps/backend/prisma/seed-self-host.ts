/* eslint-disable no-restricted-syntax */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from "@stackframe/stack-shared/dist/utils/hashes";

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Optional default admin user
  const adminEmail = process.env.STACK_DEFAULT_DASHBOARD_USER_EMAIL;
  const adminPassword = process.env.STACK_DEFAULT_DASHBOARD_USER_PASSWORD;
  const adminInternalAccess = process.env.STACK_DEFAULT_DASHBOARD_USER_INTERNAL_ACCESS === 'true';

  // Optionally disable sign up for "internal" project
  const signUpEnabled = process.env.STACK_INTERNAL_SIGN_UP_ENABLED === 'true';

  // Optionally add a custom domain to the internal project
  const dashboardDomain = process.env.NEXT_PUBLIC_STACK_DASHBOARD_URL;
  const allowLocalhost = process.env.STACK_DASHBOARD_ALLOW_LOCALHOST === 'true';

  let internalProject = await prisma.project.findUnique({
    where: {
      id: 'internal',
    },
    include: {
      config: true,
    }
  });

  if (!internalProject) {
    console.log('No existing internal project found, creating...');

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
            publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
            secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
            superSecretAdminKey: process.env.STACK_SUPER_SECRET_ADMIN_KEY,
            expiresAt: new Date('2099-12-31T23:59:59Z'),
          }],
        },
        config: {
          create: {
            allowLocalhost: true,
            signUpEnabled, // see STACK_SIGN_UP_DISABLED var above
            emailServiceConfig: {
              create: {
                proxiedEmailServiceConfig: {
                  create: {}
                }
              }
            },
            createTeamOnSignUp: false,
            clientTeamCreationEnabled: false,
            authMethodConfigs: {
              create: [
                {
                  passwordConfig: {
                    create: {},
                  }
                },
              ],
            }
          }
        }
      },
      include: {
        config: true,
      }
    });

    console.log('Internal project created');
  }

  // Create optional default admin user if credentials are provided.
  // This user will be able to login to the dashboard with both email/password and magic link.
  if (adminEmail && adminPassword) {
    const oldAdminUser = await prisma.projectUser.findFirst({
      where: {
        projectId: 'internal',
        contactChannels: {
          some: {
            type: 'EMAIL',
            value: adminEmail,
          }
        }
      }
    });

    if (oldAdminUser) {
      console.log(`User with email ${adminEmail} already exists, skipping creation`);
    } else {
      console.log(`No existing admin user with email ${adminEmail} found, creating...`);

      await prisma.$transaction(async (tx) => {
        const newUser = await tx.projectUser.create({
          data: {
            projectId: 'internal',
            serverMetadata: adminInternalAccess
              ? { managedProjectIds: ['internal'] }
              : undefined,
          }
        });

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

        console.log('Initial admin user created: ', adminEmail);
      });

      console.log('Initial admin user created: ', adminEmail);
    }
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
      throw new Error('Cannot use localhost as a trusted domain if STACK_DASHBOARD_ALLOW_LOCALHOST is not set to true');
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
