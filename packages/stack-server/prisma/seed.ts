const { PrismaClient } = require('@prisma/client');  // must use require due to ts-node shenanigans
const prisma = new PrismaClient();


async function seed() {
  console.log('Seeding database...');
  console.log(`Creating internal project... (if it doesn't exist yet)`);
  await prisma.project.upsert({
    where: {
      id: 'internal',
    },
    create: {
      id: 'internal',
      displayName: 'Internal Project',
      description: 'This project is used for Stack\'s internal dashboard',
      isProductionMode: false,
      apiKeySets: {
        create: [{
          description: "Internal API key set",
          publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ?? require('crypto').randomBytes(8).toString("hex"),
          secretServerKey: process.env.STACK_SECRET_SERVER_KEY ?? require('crypto').randomBytes(8).toString("hex"),
          expiresAt: new Date('2099-12-31T23:59:59Z'),
        }],
      },
      config: {
        create: {
          allowLocalhost: true,
          oauthProviderConfigs: {
            create: ['github', 'facebook', 'google', 'microsoft'].map((id) => ({
              id,
              proxiedOauthConfig: {
                create: {                
                  type: id.toUpperCase(),
                }
              },
              projectUserOauthAccounts: {
                create: []
              }
            })),
          },
          emailServiceConfig: {
            create: {
              senderName: 'Internal Project',
              proxiedEmailServiceConfig: {
                create: {}
              }
            }
          },
          credentialEnabled: true,
        },
      },
    },
    update: {},
  });
  console.log('Internal project created or found, make sure to set allowed callback prefixes if needed.');
  console.log('Seeding complete!');
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
// eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/return-await
}).finally(async () => await prisma.$disconnect());
