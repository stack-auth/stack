'use client';
import { useRouter } from "@/components/router";
import { Button } from "@/components/ui/button";


export default function Actions() {
  const router = useRouter();
  return (
    <div className="flex gap-2 justify-center">
      <Button variant="secondary" onClick={() => { window.open("https://docs.stack-auth.com/"); }}>
      Visit docs
      </Button>
      <Button onClick={() => { router.push("/projects"); }}>
      Continue
      </Button>
    </div>
  );
}