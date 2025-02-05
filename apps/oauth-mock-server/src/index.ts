import { strict as assert } from 'assert';
import express from 'express';
import Provider, { errors } from 'oidc-provider';

const { SessionNotFound } = errors;

const port = process.env.PORT || 8114;
const providerIds = [
  'github',
  'facebook',
  'google',
  'microsoft',
  'spotify',
  'discord',
  'gitlab',
  'bitbucket',
  'x',
];
const clients = providerIds.map((id) => ({
  client_id: id,
  client_secret: 'MOCK-SERVER-SECRET',
  redirect_uris: [`http://localhost:8102/api/v1/auth/oauth/callback/${id}`],
}));

const configuration = {
  clients,
  ttl: { Session: 60 },
  findAccount: async (ctx: any, sub: string) => ({
    accountId: sub,
    async claims() {
      return { sub, email: sub };
    },
  }),
};

const oidc = new Provider(`http://localhost:${port}`, configuration);
const app = express();

app.use(express.urlencoded({ extended: false }));


const renderLoginView = ({ title, uid, debugInfo }: { title: string, uid: string, debugInfo: any }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
  </head>
  <body>
    <h1>${title}</h1>
    <form method="post" action="/interaction/${uid}/login">
      <label>
        Login (Email):
        <input type="email" name="login" required />
      </label>
      <button type="submit">Sign in</button>
    </form>
    <div>
      <h3>Debug</h3>
      <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  </body>
</html>
`;

const renderConsentView = ({ title, uid, debugInfo }: { title: string, uid: string, debugInfo: any }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
  </head>
  <body>
    <h1>${title}</h1>
    <form method="post" action="/interaction/${uid}/confirm">
      <button type="submit">Approve</button>
    </form>
    <form method="get" action="/interaction/${uid}/abort">
      <button type="submit">Deny</button>
    </form>
    <div>
      <h3>Debug</h3>
      <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  </body>
</html>
`;

const setNoCache = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.set('cache-control', 'no-store');
  next();
};

app.get('/interaction/:uid', setNoCache, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { uid, prompt, params, session } = await oidc.interactionDetails(req, res);
    const debugInfo = { params, prompt, session };

    if (prompt.name === 'login') {
      res.send(renderLoginView({
        title: 'Sign-in',
        uid,
        debugInfo,
      }));
    } else if (prompt.name === 'consent') {
      res.send(renderConsentView({
        title: 'Authorize',
        uid,
        debugInfo,
      }));
    } else {
      res.send('Unknown prompt');
    }
  } catch (err) {
    next(err);
  }
});

app.post('/interaction/:uid/login', setNoCache, async (req, res, next) => {
  try {
    const { prompt } = await oidc.interactionDetails(req, res);
    assert.strictEqual(prompt.name, 'login', 'Expected login prompt');
    const result = { login: { accountId: req.body.login } };
    await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (err) {
    next(err);
  }
});

app.post('/interaction/:uid/confirm', setNoCache, async (req, res, next) => {
  try {
    const { prompt, params, session, grantId } = await oidc.interactionDetails(req, res);
    if (!session) throw new Error('No session found');
    assert.strictEqual(prompt.name, 'consent', 'Expected consent prompt');

    const accountId = session.accountId;
    const { details } = prompt;

    // Create or update a grant
    let grant = grantId
      ? await oidc.Grant.find(grantId)
      : new oidc.Grant({ accountId, clientId: params.client_id as string });

    if (!grant) {
      throw new Error('Failed to create or find grant');
    }

    if (Array.isArray(details.missingOIDCScope)) {
      grant.addOIDCScope(details.missingOIDCScope.join(' '));
    }
    if (Array.isArray(details.missingOIDCClaims)) {
      grant.addOIDCClaims(details.missingOIDCClaims);
    }
    if (details.missingResourceScopes && typeof details.missingResourceScopes === 'object') {
      for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
        if (Array.isArray(scopes)) {
          grant.addResourceScope(indicator, scopes.join(' '));
        }
      }
    }

    const newGrantId = await grant.save();
    const consent: { grantId?: string } = {};
    if (!grantId) consent.grantId = newGrantId;

    const result = { consent };
    await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
  } catch (err) {
    next(err);
  }
});

app.get('/interaction/:uid/abort', setNoCache, async (req, res, next) => {
  try {
    const result = {
      error: 'access_denied',
      error_description: 'End-User aborted interaction',
    };
    await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (err) {
    next(err);
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SessionNotFound) {
    res.status(410).send('Session not found or expired');
  } else {
    next(err);
  }
});

app.use(oidc.callback());

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
