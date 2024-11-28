import { auth, signIn } from "@/auth"
 
export default async function SignIn() {
  const session = await auth()

  return (
    <>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <form
        action={async () => {
        "use server"
        await signIn("stack-auth")
      }}
      >
        <button type="submit">Sign-in with Stack</button>
      </form>
    </>
  )
} 
