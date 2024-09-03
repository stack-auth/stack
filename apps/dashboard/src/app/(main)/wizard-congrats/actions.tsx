"use client";

import { Button } from "@stackframe/stack-ui";
import { useRouter } from "@/components/router";

export default function Actions() {
  const router = useRouter();
  return (
    <div className="flex justify-center gap-2">
      <Button
        variant="secondary"
        onClick={() => {
          window.open("https://docs.stack-auth.com/");
        }}
      >
        Visit docs
      </Button>
      <Button
        onClick={() => {
          router.push("/projects");
        }}
      >
        Continue
      </Button>
    </div>
  );
}
