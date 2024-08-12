import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container z-40 bg-background">
        <div className="flex h-20 items-center justify-between py-6">
          {/* <MainNav items={marketingConfig.mainNav} /> */}
          <div>adsf</div>
          <nav>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "secondary" }), "px-4")}
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{props.children}</main>
      {/* <SiteFooter /> */}
    </div>
  )
}