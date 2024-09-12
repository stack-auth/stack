'use client';

import { createSupabaseClient } from "@/utils/supabase-client";
import { useStackApp, useUser } from "@stackframe/stack";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Page() {
  const app = useStackApp();
  const user = useUser();
  const supabase = createSupabaseClient();
  const [data, setData] = useState<null | any[]>(null);

  useEffect(() => {
    supabase.from("data").select().then(({ data }) => setData(data ?? []));
  }, []);

  const listContent = data === null ? 
    <p>Loading...</p> :
    data.length === 0 ?
      <p>No notes found</p> :
      data.map((note) => <li key={note.id}>{note.text}</li>);

  return (
    <div>
      {
        user ? 
        <>
          <p>You are signed in</p>
          <p>User ID: {user.id}</p>
          <Link href={app.urls.signOut}>Sign Out</Link>
        </> : 
        <Link href={app.urls.signIn}>Sign In</Link>
      }
      <h3>Supabase data</h3>
      <ul>{listContent}</ul>
    </div>
  )
}
