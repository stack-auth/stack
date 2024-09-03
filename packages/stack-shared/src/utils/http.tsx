export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD", "TRACE", "CONNECT"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];
