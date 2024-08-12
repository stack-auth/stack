import { NavHeader } from "@/components/nav-header"

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader 
        items={[
          { title: "Home", href: "/" },
          { title: "About", href: "/about" },
          { title: "Contact", href: "/contact" },
        ]} 
      />
      <main className="flex-1">{props.children}</main>
      {/* <SiteFooter /> */}
    </div>
  )
}