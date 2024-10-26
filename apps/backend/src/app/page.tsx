import Link from "next/link";

export default function Home() {
  return <>
    Welcome to Stack Auth&apos;s API endpoint.<br />
    <br />
    Were you looking for <Link href="https://app.stack-auth.com">Stack&apos;s dashboard</Link> instead?<br />
    <br />
    You can also return to <Link href="https://stack-auth.com">https://stack-auth.com</Link>.<br />
    <br />
    <Link href="/api/v1">API v1</Link><br />
  </>;
}
