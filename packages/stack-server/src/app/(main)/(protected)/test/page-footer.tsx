import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";
import { Text } from "@stackframe/stack";
import Link from "next/link";
import { FaDiscord, FaGithub, FaLinkedin } from "react-icons/fa";

export default function PageFooter () {
  return (
    <footer>
      <Separator />

      <div className="flex flex-col md:flex-row p-4 gap-4">
        <div className="flex flex-col gap-4 md:flex-1">
          {/* <Logo full height={24} href="/projects" className="h-6"/> */}
          <ul className="flex gap-4 flex-grow">
            {[
              { href: "https://discord.stack-auth.com/", icon: FaDiscord },
              { href: "https://www.linkedin.com/company/stackframe-inc", icon: FaLinkedin },
              { href: "https://github.com/stackframe-projects/stack", icon: FaGithub },
            ].map(({ href, icon: Icon }) => (
              <li key={href}>
                <Link href={href}>
                  <Icon size={20} className="text-gray-700 dark:text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4 md:flex-1 md:justify-center">
          {
            [
              { href: "https://stack-auth.com", label: "Home" },
              { href: "https://stack-auth.com/docs", label: "Docs" },
              { href: "mailto:team@stack-auth.com", label: "Contact us" },
            ].map(({ href, label }) => (
              <Link key={label} href={href}>
                <Text variant="secondary" size='sm'>{label}</Text>
              </Link>
            ))
          }
        </div>

        <div className="flex text-sm md:flex-1 md:justify-end">
          <Text variant="secondary" size='sm'>© 2024 Stackframe Inc.</Text>
        </div>
      </div>
    </footer>
  );
}