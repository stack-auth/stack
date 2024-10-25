import { signIn } from "@/auth"
 
export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("stack-auth")
      }}
    >
      <button type="submit">Sign-in with Stack</button>
    </form>
  )
} 