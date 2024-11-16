import ipRegex from "ip-regex";

export type Ipv4Address = `${number}.${number}.${number}.${number}`;
export type Ipv6Address = string;

export function isIpAddress(ip: string): ip is Ipv4Address | Ipv6Address {
  return ipRegex({ exact: true }).test(ip);
}

export function assertIpAddress(ip: string): asserts ip is Ipv4Address | Ipv6Address {
  if (!isIpAddress(ip)) {
    throw new Error(`Invalid IP address: ${ip}`);
  }
}
