import { PGlite } from '@electric-sql/pglite';
import net from 'node:net';
import { fromNodeSocket } from 'pg-gateway/node';

const db = new PGlite();

const server = net.createServer(async (socket) => {
  let activeDb;

  console.info(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`)
  await fromNodeSocket(socket, {
    serverVersion: '16.3',

    auth: {
      // No password required
      method: 'trust',
    },

    async onStartup({ clientParams }) {
      console.info(`Connecting client to ${clientParams?.database}`)
      // If the DB is the Prisma shadow DB, create a temp in-memory instance
      if (clientParams?.database === 'prisma-shadow') {
        activeDb = new PGlite()
      } else {
        activeDb = db
      }

      // Wait for PGlite to be ready before further processing
      await activeDb.waitReady
    },

    async onMessage(data, { isAuthenticated }) {
      if (!isAuthenticated) {
        // currently we have no authentication, but let's keep it for the future
        return
      }

      // Forward raw message to PGlite and send response to client
      return await activeDb.execProtocolRaw(data)
    },
  })

  socket.on('end', () => {
    console.info('Client disconnected')
  })
})

server.listen(5432, () => {
  console.info('Server listening on port 5432')
})