import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="p-3 border-b">
        <a
          href={"/"}
          className="border rounded-md px-2 py-1 hover:bg-gray-500/10"
        >
          Back
        </a>
      </header>
      <main>{children}</main>
    </div>
  );
}