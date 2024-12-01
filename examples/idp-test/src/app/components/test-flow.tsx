"use client";

import { useState } from "react";

 
export default function TestFlow() {
  const [result, setResult] = useState<string | null>(null);

  return (
    <>
      <button onClick={async () => {
        try {
          const result = await testFlow();
          setResult(JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(error);
          setResult(`${error}`);
        }
      }}>
        Test flow
      </button>
      <div className="font-mono whitespace-pre-wrap">{result}</div>
    </>
  )
} 


const STACK_API_URL = "http://localhost:8102";


async function testFlow() {
  // Authorize redirect
  const authorizeUrl = new URL("/api/v1/integrations/neon/oauth/authorize", STACK_API_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", "neon-local");
  authorizeUrl.searchParams.set("redirect_uri", "http://localhost:30000/api/v2/identity/authorize");
  authorizeUrl.searchParams.set("state", JSON.stringify({ details: { neon_project_name: 'neon-project' } }));
  authorizeUrl.searchParams.set("code_challenge", "xf6HY7PIgoaCf_eMniSt-45brYE2J_05C9BnfIbueik");
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  window.open(authorizeUrl.toString(), "_blank");
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Callback
  const callbackUrl = prompt("A new window should have opened. Please paste the callback URL back here:");
  if (!callbackUrl) throw new Error("No callback URL provided");
  const callbackUrlObj = new URL(callbackUrl);
  if (callbackUrlObj.searchParams.get("state") !== authorizeUrl.searchParams.get("state")) throw new Error("State mismatch");
  const code = callbackUrlObj.searchParams.get("code");
  if (!code) throw new Error("No code provided");
  
  // Token exchange
  const tokenUrl = new URL("/api/v1/integrations/neon/oauth/token", STACK_API_URL);
  const tokenResponse = await fetch(tokenUrl.toString(), {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: "neon-local",
      client_secret: "neon-local-secret",
      code,
      code_verifier: "W2LPAD4M4ES-3wBjzU6J5ApykmuxQy5VTs3oSmtboDM",
      redirect_uri: authorizeUrl.searchParams.get("redirect_uri")!,
    }).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const tokenData = await tokenResponse.json();
  return tokenData;
}

async function createCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function sha256(base64urlInput: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(base64urlInput);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
