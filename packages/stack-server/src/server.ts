// server.js
import { Server, createServer } from 'http';
import next from 'next';

const app = next({ dev: true });
const handle = app.getRequestHandler();

let serverInstance: Server | null = null;

export function startServer(port: number) {
  return app.prepare().then(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const server = createServer((req, res) => handle(req, res));
    serverInstance = server.listen(port);
    console.log(`> Ready on http://localhost:${port}`);
    return server;
  });
}

export function stopServer() {
  if (serverInstance) {
    serverInstance.close();
    console.log('> Server stopped');
  }
}
