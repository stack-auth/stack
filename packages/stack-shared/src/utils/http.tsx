export const HTTP_METHODS = {
  "GET": {
    safe: true,
    idempotent: true,
  },
  "POST": {
    safe: false,
    idempotent: false,
  },
  "PUT": {
    safe: false,
    idempotent: true,
  },
  "DELETE": {
    safe: false,
    idempotent: true,
  },
  "PATCH": {
    safe: false,
    idempotent: false,
  },
  "OPTIONS": {
    safe: true,
    idempotent: true,
  },
  "HEAD": {
    safe: true,
    idempotent: true,
  },
  "TRACE": {
    safe: true,
    idempotent: true,
  },
  "CONNECT": {
    safe: false,
    idempotent: false,
  },
} as const;
export type HttpMethod = keyof typeof HTTP_METHODS;
