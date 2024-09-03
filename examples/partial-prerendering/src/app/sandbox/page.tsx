import Link from "next/link";
import { ClientDynamic } from "./client-dynamic";
import { ClientStatic } from "./client-static";
import { ServerDynamic } from "./server-dynamic";
import { ServerStatic } from "./server-static";
import { SimpleSuspense } from "./simple-suspense";

export default function SandboxPage() {
  return (
    <main>
      <h1>Sandbox</h1>

      <Sandbox />

      <br />
      <br />
      <br />
      <Link href="/">To Home</Link>
    </main>
  );
}

function Sandbox() {
  return (
    <>
      <div>
        <SimpleSuspense>
          <ServerStatic />
        </SimpleSuspense>
      </div>

      <div>
        <SimpleSuspense>
          <ServerDynamic ms={1_000} />
        </SimpleSuspense>
      </div>

      <div>
        <SimpleSuspense>
          <ServerDynamic />
        </SimpleSuspense>
      </div>

      <div>
        <SimpleSuspense>
          <ServerDynamic>
            inner:
            <ServerDynamic />
          </ServerDynamic>
        </SimpleSuspense>
      </div>

      <div>
        <SimpleSuspense>
          <ServerDynamic>
            inner:
            <SimpleSuspense>
              <ServerDynamic />
            </SimpleSuspense>
          </ServerDynamic>
        </SimpleSuspense>
      </div>

      <div>
        <SimpleSuspense>
          <ClientStatic />
        </SimpleSuspense>
      </div>

      <div>
        <SimpleSuspense>
          <ClientDynamic val="client-dynamic-in-suspense" />
        </SimpleSuspense>
      </div>

      <div>
        <SimpleSuspense>
          <ServerDynamic>
            inner:
            <SimpleSuspense>
              <ClientDynamic val="client-dynamic-in-suspense-in-server-dynamic-in-suspense" />
            </SimpleSuspense>
          </ServerDynamic>
        </SimpleSuspense>
      </div>

      <div>
        <SimpleSuspense>
          <span>span</span>
        </SimpleSuspense>
      </div>
    </>
  );
}
