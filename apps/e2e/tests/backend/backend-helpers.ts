import { STACK_BACKEND_BASE_URL, NiceResponse, niceFetch } from "../helpers";

export function niceBackendFetch(url: string, options?: RequestInit): Promise<NiceResponse> {
  const res = niceFetch(new URL(url, STACK_BACKEND_BASE_URL), options);
  return res;
}
