import { Command } from 'commander';
import { createServer, request as httpRequest } from "http";
import httpProxy from "http-proxy";
import { minimatch } from 'minimatch';
import next from "next";
import { parse } from "url";

const program = new Command();

program
  .description('Stack Proxy\nA simple proxy that authenticates http requests and provide sign-in interface to your app\nAll the routes except /handler/* are forwarded to the server with the user info headers')
  .requiredOption('-s, --server-port <number>', 'The server port', parseInt)
  .option('-p, --proxy-port <number>', 'The proxy port', x => parseInt(x, 10), 3000)
  .option('-h, --proxy-host <string>', 'The proxy host', 'localhost')
  .option('-u, --protected-pattern <string>', 'The protected URL pattern (glob syntax)', '**');

program.parse(process.argv);
const argOptions = program.opts();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const proxy = httpProxy.createProxyServer({});

const allHeaders = [
  "x-stack-authenticated",
  "x-stack-user-id",
  "x-stack-user-primary-email",
  "x-stack-user-display-name",
];

app.prepare().then(() => {
  createServer((req, res) => {
    let parsedUrl = parse(req.url!, true);

    // Remove proxy auth headers
    for (const header of allHeaders) {
      delete req.headers[header];
    }

    if (parsedUrl.pathname?.startsWith("/handler")) {
      // This is a hack for the account-setting + next.js basePath incompatibility, should be fixed later in the stack package
      if (req.url?.includes("/handler/handler")) {
        parsedUrl = parse(req.url.replace("/handler/handler", "/handler"), true);
      }

      handle(req, res, parsedUrl);
    } else {
      const options = {
        hostname: "localhost",
        port: argOptions.proxyPort,
        path: "/handler/me",
        method: "GET",
        headers: req.headers,
      };

      const meReq = httpRequest(options, (meRes) => {
        let data = "";
        meRes.on("data", (chunk) => {
          data += chunk;
        });

        meRes.on("end", () => {
          let userInfo;
          try {
            userInfo = JSON.parse(data);
          } catch (e) {
            console.error(e);
            res.statusCode = 500;
            res.end("Internal server error");
            return;
          }

          if (userInfo.authenticated) {
            req.headers["x-stack-authenticated"] = "true";
            req.headers["x-stack-user-id"] = userInfo.user.id;
            req.headers["x-stack-user-primary-email"] = userInfo.user.primary_email;
            req.headers["x-stack-user-display-name"] = userInfo.user.display_name;
          } else if (minimatch(req.url!, argOptions.protectedPattern)) {
            res.statusCode = 302;
            res.setHeader("Location", "/handler/sign-in");
            res.end();
            return;
          }

          proxy.web(req, res, { target: `http://localhost:${argOptions.serverPort}` });
        });
      });

      meReq.on("error", (err) => {
        res.statusCode = 500;
        res.end("Internal server error");
      });

      meReq.end();
    }
  }).listen(argOptions.proxyPort);

  console.log(`Stack Proxy forwarding http://localhost:${argOptions.serverPort} to http://${argOptions.proxyHost}:${argOptions.proxyPort}\nProtecting ${argOptions.protectedPattern}`);
});
