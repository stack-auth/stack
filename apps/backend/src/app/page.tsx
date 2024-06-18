import Link from "next/link";

export default function Home() {
  return <>
    Welcome to Stack&apos;s API endpoint.<br />
    <br />
    <Link href="/api/v1">API v1</Link><br />
  </>;
}
