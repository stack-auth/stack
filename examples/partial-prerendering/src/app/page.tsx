import { stackServerApp } from "@/stack";
import { UserButton } from "@stackframe/stack";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main>
      <h1>Welcome to Stack&apos;s Partial Prerendering demo!</h1>

      <p>
        This is a demo of Stack&apos;s partial prerendering capabilities. The text you are reading here is statically prerendered, while user information below is fetched on a dynamic server component.
      </p>

      <p>
        For the demo, there is an artificial two second delay for network requests. Reload the page to see it again.
      </p>

      <div style={{ border: "1px solid grey", margin: 8, padding: 8, borderRadius: 4 }}>
        <Suspense fallback="Loading user info...">
          <UserInfo />
        </Suspense>
      </div>

      <div style={{ marginTop: 96 }}>
        Source code:

        <pre>
          {`
<Suspense fallback="Loading user info...">
  <UserInfo />
</Suspense>
  
async function UserInfo() {
  const user = await stackServerApp.getUser();

  return (
    <div>
      {user && <>
        You are logged in.<br />
        Display name: {user.displayName}<br />
        E-mail: {user.primaryEmail}<br />
        <Link href="/handler/account-settings">Account settings</Link>
      </>}
      {!user && <>
        You are not logged in.<br />
        <Link href="/handler/sign-in">Log in</Link>
      </>}
    </div>
  );
}
          `.trim()}
        </pre>
      </div>
    </main>
  );
}

async function UserInfo() {
  const user = await stackServerApp.getUser();

  return (
    <div>
      {user && <>
        You are logged in.<br />
        Display name: {user.displayName ?? "None"}<br />
        E-mail: {user.primaryEmail ?? "None"}<br />
        <Link href="/handler/account-settings">Account settings</Link>
      </>}
      {!user && <>
        You are not logged in.<br />
        <Link href="/handler/sign-in">Log in</Link>
      </>}
    </div>
  );
}
