import { prismaClient } from '@/prisma-client';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


async function seed() {
  console.log('Seeding database...');

  const oldProject = await prisma.project.findUnique({
    where: {
      id: 'internal',
    },
  });

  if (oldProject) {
    console.log('Internal project already exists, skipping its creation');
  } else {
    await prismaClient.$transaction(async (tx) => {
      const createdProject = await prisma.project.upsert({
        where: {
          id: 'internal',
        },
        create: {
          id: 'internal',
          displayName: 'Stack Dashboard',
          description: 'Stack\'s admin dashboard',
          isProductionMode: false,
          apiKeySets: {
            create: [{
              description: "Internal API key set",
              publishableClientKey: "this-publishable-client-key-is-for-local-development-only",
              secretServerKey: "this-secret-server-key-is-for-local-development-only",
              superSecretAdminKey: "this-super-secret-admin-key-is-for-local-development-only",
              expiresAt: new Date('2099-12-31T23:59:59Z'),
            }],
          },
          config: {
            create: {
              allowLocalhost: true,
              oauthProviderConfigs: {
                create: (['github', 'facebook', 'google', 'microsoft'] as const).map((id) => ({
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
              emailServiceConfig: {
                create: {
                  proxiedEmailServiceConfig: {
                    create: {}
                  }
                }
              },
              createTeamOnSignUp: false,
              clientTeamCreationEnabled: true,
            },
          },
        },
        update: {},
      });

      await prisma.projectConfig.update({
        where: {
          id: createdProject.configId,
        },
        data: {
          authMethodConfigs: {
            create: [
              {
                otpConfig: {
                  create: {
                    contactChannelType: 'EMAIL',
                  }
                }
              },
              {
                passwordConfig: {
                  create: {
                    type: 'EMAIL',
                  }
                }
              },
              ...(['github', 'facebook', 'google', 'microsoft'] as const).map((id) => ({
                oauthProviderConfig: {
                  connect: {
                    projectConfigId_id: {
                      id,
                      projectConfigId: createdProject.configId,
                    }
                  }
                }
              }))
            ],
          },
        }
      });
      console.log('Internal project created');

      // eslint-disable-next-line no-restricted-syntax
      const adminGithubId = process.env.STACK_SETUP_ADMIN_GITHUB_ID;
      if (adminGithubId) {
      console.log("Found admin GitHub ID in environment variables, creating admin user...");
      await prisma.projectUser.upsert({
        where: {
          projectId_projectUserId: {
            projectId: 'internal',
            projectUserId: '707156c3-0d1b-48cf-b09d-3171c7f613d5',
          },
        },
        create: {
          projectId: 'internal',
          projectUserId: '707156c3-0d1b-48cf-b09d-3171c7f613d5',
          displayName: 'Admin user generated by seed script',
          serverMetadata: {
            managedProjectIds: [
              "internal",
              "12345678-1234-1234-1234-123456789abc", // intentionally invalid project ID to ensure we don't rely on project IDs being valid
            ],
          },
          projectUserOAuthAccounts: {
            create: [{
              providerAccountId: adminGithubId,
              projectConfigId: createdProject.configId,
              oauthProviderConfigId: 'github',
            }],
          },
        },
        update: {},
      });
      console.log(`Admin user created (if it didn't already exist)`);
      } else {
      console.log('No admin GitHub ID found in environment variables, skipping admin user creation');
      }
    });
  }

  console.log('Seeding complete!');
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
// eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/return-await
}).finally(async () => await prisma.$disconnect());
