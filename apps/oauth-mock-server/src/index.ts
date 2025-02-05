/* eslint-disable no-console, camelcase, no-unused-vars */
import express, { urlencoded } from 'express';
import { strict as assert } from 'node:assert';
import * as querystring from 'node:querystring';
import { inspect } from 'node:util';
import Provider, { errors } from 'oidc-provider';

const { SessionNotFound } = errors;

// A simple dummy Account implementation.
// In production, replace this with your actual account model.
class Account {
  static async findByLogin(login) {
    // For testing, we simply use the provided login (email) as the accountId.
    return { accountId: login };
  }
}

const port = process.env.PORT || 8114;
const mockedProviders = [
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

const clients = mockedProviders.map((providerId) => ({
  client_id: providerId,
  client_secret: 'MOCK-SERVER-SECRET',
  redirect_uris: [
    `http://localhost:8102/api/v1/auth/oauth/callback/${providerId}`,
  ],
}));

// OIDC provider configuration with a custom findAccount function.
const configuration = {
  clients,
  ttl: {
    Session: 60,
  },
  findAccount: async (ctx, id) => {
    return {
      accountId: id,
      async claims(use, scope) {
        return { sub: id, email: id };
      },
    };
  },
};

const oidc = new Provider(`http://localhost:${port}`, configuration);

const app = express();
app.use(urlencoded({ extended: false }));

// -------------------------------------------------------------------------
// Minimal view engine
// We define a simple app.render function that will render two templates:
// 'login' for the login form and 'interaction' for the consent form.
app.render = (view, locals, callback) => {
  let html = '';
  if (view === 'login') {
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${locals.title}</title>
        </head>
        <body>
          <h1>${locals.title}</h1>
          <form method="post" action="/interaction/${locals.uid}/login">
            <label>Login (Email): <input type="email" name="login" required /></label>
            <button type="submit">Sign in</button>
          </form>
          <div>
            <h3>Debug</h3>
            <pre>${locals.dbg ? `Params: ${locals.dbg.params}\nPrompt: ${locals.dbg.prompt}` : ''}</pre>
          </div>
        </body>
      </html>
    `;
  } else if (view === 'interaction') {
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${locals.title}</title>
        </head>
        <body>
          <h1>${locals.title}</h1>
          <form method="post" action="/interaction/${locals.uid}/confirm">
            <button type="submit">Approve</button>
          </form>
          <form method="get" action="/interaction/${locals.uid}/abort">
            <button type="submit">Deny</button>
          </form>
          <div>
            <h3>Debug</h3>
            <pre>${locals.dbg ? `Params: ${locals.dbg.params}\nPrompt: ${locals.dbg.prompt}` : ''}</pre>
          </div>
        </body>
      </html>
    `;
  } else if (view === '_layout') {
    // Layout simply wraps the content; here we just output the body.
    html = locals.body;
  }
  callback(null, html);
};

// Middleware to override res.render using our simple view engine.
app.use((req, res, next) => {
  const origRender = res.render;
  res.render = (view, locals) => {
    app.render(view, locals, (err, html) => {
      if (err) throw err;
      origRender.call(res, '_layout', {
        ...locals,
        body: html,
      });
    });
  };
  next();
});

// -------------------------------------------------------------------------
// Custom implementation of isEmpty, replacing lodash's isEmpty

/**
 * Checks if the provided value is "empty".
 *
 * - For `null` or `undefined`, returns `true`.
 * - For strings and arrays, returns `true` if the length is 0.
 * - For objects, returns `true` if it has no own enumerable properties.
 *
 * @param {*} value - The value to check.
 * @returns {boolean} - Returns true if the value is empty.
 */
function isEmpty(value: any) {
  if (value == null) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Debug helper function (similar to the snippet you provided)
const keys = new Set();
const debug = (obj) =>
  querystring.stringify(
    Object.entries(obj).reduce((acc, [key, value]) => {
      keys.add(key);
      if (isEmpty(value)) return acc;
      acc[key] = inspect(value, { depth: null });
      return acc;
    }, {}),
    '<br/>',
    ': ',
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value;
      },
    }
  );

// No-cache middleware to ensure fresh interactions.
function setNoCache(req, res, next) {
  res.set('cache-control', 'no-store');
  next();
}

// -------------------------------------------------------------------------
// Interaction routes

// GET /interaction/:uid - Render login or consent view based on the prompt.
app.get('/interaction/:uid', setNoCache, async (req, res, next) => {
  try {
    const { uid, prompt, params, session } = await oidc.interactionDetails(req, res);
    const client = await oidc.Client.find(params.client_id);
    switch (prompt.name) {
      case 'login': {
        return res.render('login', {
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Sign-in',
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt),
          },
        });
      }
      case 'consent': {
        return res.render('interaction', {
          client,
          uid,
          details: prompt.details,
          params,
          title: 'Authorize',
          session: session ? debug(session) : undefined,
          dbg: {
            params: debug(params),
            prompt: debug(prompt),
          },
        });
      }
      default: {
        return res.send('Unknown prompt');
      }
    }
  } catch (err) {
    return next(err);
  }
});

app.post('/interaction/:uid/login', setNoCache, async (req, res, next) => {
  try {
    const { prompt } = await oidc.interactionDetails(req, res);
    assert.equal(prompt.name, 'login');
    const result = {
      login: {
        accountId: req.body.login
      },
    };
    await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
  } catch (err) {
    next(err);
  }
});

// POST /interaction/:uid/confirm - Handle consent approval.
app.post('/interaction/:uid/confirm', setNoCache, async (req, res, next) => {
  try {
    const interactionDetails = await oidc.interactionDetails(req, res);
    if (!interactionDetails.session) {
      throw new Error('No session found');
    }

    const { prompt: { name, details }, params } = interactionDetails;
    const accountId = interactionDetails.session.accountId;
    assert.equal(name, 'consent');

    let { grantId } = interactionDetails;
    let grant;
    if (grantId) {
      // Modifying an existing grant.
      grant = await oidc.Grant.find(grantId);
    } else {
      // Creating a new grant.
      grant = new oidc.Grant({
        accountId,
        clientId: params.client_id as string,
      });
    }

    if (!grant) {
      throw new Error('Failed to create or find grant');
    }

    if (details.missingOIDCScope && Array.isArray(details.missingOIDCScope)) {
      grant.addOIDCScope(details.missingOIDCScope.join(' '));
    }
    if (details.missingOIDCClaims && Array.isArray(details.missingOIDCClaims)) {
      grant.addOIDCClaims(details.missingOIDCClaims);
    }
    if (details.missingResourceScopes && typeof details.missingResourceScopes === 'object') {
      for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
        if (Array.isArray(scopes)) {
          grant.addResourceScope(indicator, scopes.join(' '));
        }
      }
    }

    grantId = await grant.save();
    const consent: { grantId?: string } = {};
    if (!interactionDetails.grantId) {
      consent.grantId = grantId;
    }
    const result = { consent };
    console.log('result', result);
    await oidc.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
  } catch (err) {
    next(err);
  }
});

// GET /interaction/:uid/abort - Handle user aborting the interaction.
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

// Error handling middleware.
app.use((err, req, res, next) => {
  if (err instanceof SessionNotFound) {
    // Session expired or not found.
    res.status(410).send('Session not found or expired');
  } else {
    next(err);
  }
});

// -------------------------------------------------------------------------
// Mount the oidc-provider callback middleware.
app.use(oidc.callback());

// Start the server.
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
