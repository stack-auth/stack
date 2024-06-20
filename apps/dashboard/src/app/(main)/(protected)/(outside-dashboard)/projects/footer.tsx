import { Link } from "@/components/link";
import { Separator } from "@/components/ui/separator";
import { Text } from "@stackframe/stack";
import { FaDiscord, FaGithub, FaLinkedin } from "react-icons/fa";

export default function Footer () {
  return (
    <footer>
      <Separator />

      <div className="flex flex-col md:flex-row p-4 gap-4">
        <div className="flex flex-col gap-4 md:flex-1">
          <ul className="flex gap-4 flex-grow">
            {[
              { href: "https://discord.stack-auth.com/", icon: FaDiscord },
              { href: "https://www.linkedin.com/company/stackframe-inc", icon: FaLinkedin },
              { href: "https://github.com/stack-auth/stack", icon: FaGithub },
            ].map(({ href, icon: Icon }) => (
              <li key={href}>
                <Link href={href}>
                  <Icon size={20} className="text-gray-700 dark:text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex text-sm md:flex-1 md:justify-center">
          <Text variant="secondary" size='sm'>© 2024 Stackframe Inc.</Text>
        </div>

        <div className="flex gap-4 md:flex-1 md:justify-end">
          {[
            { href: "https://stack-auth.com", label: "Home" },
            { href: "https://docs.stack-auth.com", label: "Docs" },
            { href: "mailto:team@stack-auth.com", label: "Contact us" },
          ].map(({ href, label }) => (
            <Link key={label} href={href}>
              <Text variant="secondary" size='sm'>{label}</Text>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
