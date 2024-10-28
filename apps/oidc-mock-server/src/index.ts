import Provider, { Configuration, interactionPolicy } from 'oidc-provider';
const { Prompt, Check, base } = interactionPolicy;

import QuickLRU from 'quick-lru';

interface StorageValue {
  consumed?: number;
  uid: string;
  grantId?: string;
  userCode?: string;
  [key: string]: any; // Add index signature to allow arbitrary string keys
}

let storage = new QuickLRU<string, StorageValue | string[] | string>({ maxSize: 1000 });

function grantKeyFor(id: string): string {
  return `grant:${id}`;
}

function sessionUidKeyFor(id: string): string {
  return `sessionUid:${id}`;
}

function userCodeKeyFor(userCode: string): string {
  return `userCode:${userCode}`;
}

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

class MemoryAdapter {
  private model: string;

  constructor(model: string) {
    console.log('MemoryAdapter constructor', model);
    this.model = model;
  }

  key(id: string): string {
    return `${this.model}:${id}`;
  }

  async destroy(id: string): Promise<void> {
    console.log('MemoryAdapter destroy', id);
    const key = this.key(id);
    storage.delete(key);
  }

  async consume(id: string): Promise<void> {
    console.log('MemoryAdapter consume', id);
    const value = storage.get(this.key(id)) as StorageValue;
    value.consumed = Math.floor(Date.now() / 1000);
  }

  async find(id: string): Promise<StorageValue | undefined> {
    console.log('MemoryAdapter find', id);
    return storage.get(this.key(id)) as StorageValue | undefined;
  }

  async findByUid(uid: string): Promise<StorageValue | undefined> {
    console.log('MemoryAdapter findByUid', uid);
    const id = storage.get(sessionUidKeyFor(uid)) as string;
    return this.find(id);
  }

  async findByUserCode(userCode: string): Promise<StorageValue | undefined> {
    console.log('MemoryAdapter findByUserCode', userCode);
    const id = storage.get(userCodeKeyFor(userCode)) as string;
    return this.find(id);
  }

  async upsert(id: string, payload: StorageValue, expiresIn: number): Promise<void> {
    const key = this.key(id);
    console.log('MemoryAdapter upsert', id, payload, expiresIn);
    if (this.model === 'Session') {
      storage.set(sessionUidKeyFor(payload.uid), id, { maxAge: expiresIn * 1000 });
    }

    const { grantId, userCode } = payload;
    if (grantable.has(this.model) && grantId) {
      const grantKey = grantKeyFor(grantId);
      const grant = storage.get(grantKey) as string[];
      if (!grant) {
        storage.set(grantKey, [key]);
      } else {
        grant.push(key);
      }
    }

    if (userCode) {
      storage.set(userCodeKeyFor(userCode), id, { maxAge: expiresIn * 1000 });
    }

    storage.set(key, payload, { maxAge: expiresIn * 1000 });
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    const grantKey = grantKeyFor(grantId);
    const grant = storage.get(grantKey) as string[];
    if (grant) {
      grant.forEach((token: string) => storage.delete(token));
      storage.delete(grantKey);
    }
  }
}

const port = Number.parseInt(process.env.PORT || "8117");

const mockedProviders = [
  "stack-auth",
];

const configuration: Configuration  = {
  adapter: MemoryAdapter,
  clients: mockedProviders.map((providerId) => ({
    client_id: "client-id",
    client_secret: "test-client-secret",
    redirect_uris: [
      `http://localhost:8116/api/auth/callback/stack-auth`,
    ],
  })),
  ttl: {
    // we make sessions short so it asks us for our login again after a minute, instead of automatically logging us in with the already-logged-in session
    Session: 60,
  },
  features: {
    devInteractions: {
      enabled: false,
    },
  },
  
  interactions: {
    // THIS IS WHERE WE REDIRECT TO PRIMARY AUTH SERVER
    // TODO: do we need to sanitize the parameter?
    url: (ctx, interaction) => `http://localhost:8103/sign-in?interaction_uid=${interaction.uid}&returnTo=${interaction.returnTo}`,

  }, 
  async findAccount(ctx, id) {
    return {
      accountId: id,
      claims: async (use, scope, claims, rejected) => {
        return {
          sub: id,
          email: "test@example.com",
          email_verified: true,
          name: "Test User"
        };
      }
    };
  },
};

// TODO: add stateful session management


const oidc = new Provider(`http://localhost:${port}`, configuration);

oidc.listen(port, () => {
  console.log(`oidc-provider listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`);
});
