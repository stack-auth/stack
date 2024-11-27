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

  const existingProject = await prisma.project.findUnique({
    where: {
      id: 'internal',
    },
  });

  if (existingProject) {
    console.log('Internal project already exists, skipping seed script');
    return;
  }

  await prisma.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
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
    });

    console.log('Internal project created');

    // Create optional default admin user if credentials are provided.
    // This user will be able to login to the dashboard with both email/password and magic link.
    if (adminEmail && adminPassword) {
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
          projectConfigId: createdProject.configId
        },
        include: {
          authMethodConfig: true,
        }
      });

      await tx.authMethod.create({
        data: {
          projectId: 'internal',
          projectConfigId: createdProject.configId,
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
    }
  });

  console.log('Seeding complete!');
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
}).finally(async () => await prisma.$disconnect());
